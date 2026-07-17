/**
 * @file src/controllers/bookingController.js
 * @description Booking management: create, read, update, cancel.
 *              Includes automatic double-booking conflict detection.
 */

const pool = require("../config/database");
const { asyncHandler, successResponse, createError } = require("../utils/helpers");
const { validationResult } = require("express-validator");

/**
 * @route   GET /api/v1/bookings
 * @desc    Get all bookings with optional date, court, and status filters
 * @access  Private
 */
const getAllBookings = asyncHandler(async (req, res) => {
  const { date, court_id, status } = req.query;

  // ── AUTO-CANCEL TIMED OUT BOOKINGS (15 MINS) ──
  const [cancelResult] = await pool.query(`
    UPDATE bookings 
    SET status = 'cancelled' 
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL 15 MINUTE
  `);
  if (cancelResult.affectedRows > 0) {
    const io = req.app.get("io");
    if (io) io.emit("schedule_updated");
  }

  let query = `
    SELECT 
      b.*,
      c.name AS court_name
    FROM bookings b
    LEFT JOIN courts c ON b.court_id = c.court_id
    WHERE 1=1
  `;
  const params = [];

  // Apply optional filters dynamically
  if (date) { query += " AND b.booking_date = ?"; params.push(date); }
  if (court_id) { query += " AND b.court_id = ?"; params.push(court_id); }
  if (status) { query += " AND b.status = ?"; params.push(status); }

  query += " ORDER BY b.booking_date ASC, b.start_time ASC";

  const [bookings] = await pool.query(query, params);

  // Mask sensitive data for regular customers (IDOR prevention)
  if (req.user.role === "customer") {
    bookings.forEach(b => {
      if (b.created_by !== req.user.id) {
        b.customer_name = "Khách hàng";
        b.customer_phone = "***";
        b.total_price = null;
      }
    });
  }

  res.json(successResponse("Bookings retrieved", bookings, { total: bookings.length }));
});

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get single booking with court and payment info
 * @access  Private
 */
const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ── AUTO-CANCEL TIMED OUT BOOKINGS (15 MINS) ──
  const [cancelResult] = await pool.query(`
    UPDATE bookings 
    SET status = 'cancelled' 
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL 15 MINUTE
  `);
  if (cancelResult.affectedRows > 0) {
    const io = req.app.get("io");
    if (io) io.emit("schedule_updated");
  }

  const [bookings] = await pool.query(
    `SELECT 
        b.*,
        c.name AS court_name,
        p.amount, p.payment_method, p.payment_status, p.paid_at
     FROM bookings b
     LEFT JOIN courts c ON b.court_id = c.court_id
     LEFT JOIN payments p ON b.booking_id = p.booking_id
     WHERE b.booking_id = ?`,
    [id]
  );

  if (bookings.length === 0) {
    throw createError(`Booking with ID ${id} not found.`, 404);
  }

  const booking = bookings[0];

  // Mask sensitive data for regular customers (IDOR prevention)
  if (req.user.role === "customer" && booking.created_by !== req.user.id) {
    booking.customer_name = "Khách hàng";
    booking.customer_phone = "***";
    booking.total_price = null;
  }

  res.json(successResponse("Booking retrieved", booking));
});

/**
 * @route   POST /api/v1/bookings
 * @desc    Create a new booking — prevents double-booking conflicts
 * @access  Private
 */
const createBooking = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    court_id,
    customer_name,
    customer_phone,
    booking_date,
    start_time,
    end_time,
    note,
  } = req.body;

  // ── PREVENT PAST BOOKINGS \u0026 INVALID TIME ───────────────────────────────────
  if (start_time >= end_time) {
    return res.status(400).json({ success: false, message: "End time must be after start time." });
  }

  // Get current time in Vietnam (UTC+7)
  const nowInVN = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const bookingDateTime = new Date(`${booking_date}T${start_time}`);
  
  if (bookingDateTime < nowInVN) {
    return res.status(400).json({ success: false, message: "Cannot book a time slot in the past." });
  }

  // ── CONFLICT DETECTION ─────────────────────────────────────────────────────
  // Check if any ACTIVE booking on the same court and date overlaps with
  // the requested time slot. Two slots overlap if:
  //   existing.start_time < requested.end_time AND existing.end_time > requested.start_time
  const [conflicts] = await pool.query(
    `SELECT booking_id FROM bookings
     WHERE court_id = ?
       AND booking_date = ?
       AND status NOT IN ('cancelled')
       AND start_time < ?
       AND end_time > ?`,
    [court_id, booking_date, end_time, start_time]
  );

  if (conflicts.length > 0) {
    throw createError(
      `Court ${court_id} is already booked during this time slot on ${booking_date}.`,
      409 // HTTP 409 Conflict
    );
  }

  // ── Calculate price based on court's price_per_hour ──────────
  const [courtData] = await pool.query(
    `SELECT price_per_hour FROM courts WHERE court_id = ?`,
    [court_id]
  );
  
  const pricePerHour = courtData.length > 0 ? parseFloat(courtData[0].price_per_hour) : 0;
  
  const startHour = parseInt(start_time.split(":")[0]);
  const endHour = parseInt(end_time.split(":")[0]);
  const duration = endHour - startHour;
  
  const totalPrice = duration > 0 ? duration * pricePerHour : pricePerHour;

  // ── Insert booking ──────────────────────────────────────────────────────────
  const [result] = await pool.query(
    `INSERT INTO bookings 
       (court_id, customer_name, customer_phone, booking_date, start_time, end_time, total_price, status, created_by, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [court_id, customer_name, customer_phone, booking_date, start_time, end_time, totalPrice, req.user.id, note || null]
  );

  const [newBooking] = await pool.query(
    "SELECT * FROM bookings WHERE booking_id = ?",
    [result.insertId]
  );

  const io = req.app.get("io");
  if (io) {
    io.emit("schedule_updated");
  }

  res.status(201).json(successResponse("Booking created successfully", newBooking[0]));
});

/**
 * @route   PATCH /api/v1/bookings/:id/status
 * @desc    Update booking status (confirmed, cancelled, completed)
 * @access  Private
 */
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
  if (!validStatuses.includes(status)) {
    throw createError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
  }

  const [existing] = await pool.query(
    "SELECT * FROM bookings WHERE booking_id = ?", [id]
  );
  if (existing.length === 0) {
    throw createError(`Booking with ID ${id} not found.`, 404);
  }

  await pool.query(
    "UPDATE bookings SET status = ? WHERE booking_id = ?",
    [status, id]
  );

  const [updated] = await pool.query("SELECT * FROM bookings WHERE booking_id = ?", [id]);

  const io = req.app.get("io");
  if (io) {
    io.emit("schedule_updated");
  }

  res.json(successResponse(`Booking status updated to '${status}'`, updated[0]));
});



module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
};
