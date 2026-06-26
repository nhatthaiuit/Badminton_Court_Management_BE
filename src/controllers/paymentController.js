/**
 * @file src/controllers/paymentController.js
 * @description Payment management for bookings (Mock Gateway)
 */

const pool = require("../config/database");
const { asyncHandler, successResponse, createError } = require("../utils/helpers");

/**
 * @route   POST /api/v1/payments/mock-pay
 * @desc    Simulate a successful payment for a pending booking
 * @access  Private
 */
const mockPay = asyncHandler(async (req, res) => {
  const { booking_id } = req.body;

  if (!booking_id) {
    throw createError("Booking ID is required.", 400);
  }

  // 1. Find the booking
  const [bookings] = await pool.query(
    "SELECT * FROM bookings WHERE booking_id = ?",
    [booking_id]
  );

  if (bookings.length === 0) {
    throw createError(`Booking with ID ${booking_id} not found.`, 404);
  }

  const booking = bookings[0];

  // 2. Check if already paid or cancelled
  if (booking.status !== "pending") {
    throw createError(`Booking is currently '${booking.status}'. Only pending bookings can be paid.`, 400);
  }

  // 3. Check if timeout has occurred (15 minutes)
  const now = new Date();
  const createdAt = new Date(booking.created_at);
  const diffMinutes = Math.floor((now - createdAt) / 60000);

  if (diffMinutes >= 15) {
    throw createError("Payment timeout. This booking has expired.", 400);
  }

  // 4. Update booking status to confirmed
  await pool.query(
    "UPDATE bookings SET status = 'confirmed' WHERE booking_id = ?",
    [booking_id]
  );

  // 5. Create or update payment record
  // Check if payment record exists
  const [existingPayments] = await pool.query(
    "SELECT payment_id FROM payments WHERE booking_id = ?",
    [booking_id]
  );

  if (existingPayments.length > 0) {
    await pool.query(
      `UPDATE payments 
       SET payment_status = 'paid', payment_method = 'bank_transfer', paid_at = NOW(), amount = ?
       WHERE booking_id = ?`,
      [booking.total_price, booking_id]
    );
  } else {
    await pool.query(
      `INSERT INTO payments (booking_id, amount, payment_method, payment_status, paid_at)
       VALUES (?, ?, 'bank_transfer', 'paid', NOW())`,
      [booking_id, booking.total_price]
    );
  }

  // 6. Emit socket event
  const io = req.app.get("io");
  if (io) {
    io.emit("schedule_updated");
  }

  res.json(successResponse("Payment successful. Booking confirmed."));
});

module.exports = {
  mockPay,
};
