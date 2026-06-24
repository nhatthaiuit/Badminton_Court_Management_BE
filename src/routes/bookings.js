/**
 * @file src/routes/bookings.js
 * @description Booking management routes.
 */

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const bookingController = require("../controllers/bookingController");
const { authenticate, authorize } = require("../middlewares/auth");

const bookingValidation = [
  body("court_id").isInt({ min: 1 }).withMessage("Valid court ID is required"),
  body("customer_name").trim().notEmpty().withMessage("Customer name is required"),
  body("customer_phone")
    .matches(/^[0-9]{9,11}$/)
    .withMessage("Valid phone number is required"),
  body("booking_date").isDate().withMessage("Valid booking date (YYYY-MM-DD) is required"),
  body("start_time")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:MM format"),
  body("end_time")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("End time must be in HH:MM format"),
];

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Court booking management
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (filterable by date and court)
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter bookings by date (YYYY-MM-DD)
 *       - in: query
 *         name: court_id
 *         schema:
 *           type: integer
 *         description: Filter by court ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get("/", authenticate, bookingController.getAllBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a single booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking details
 *       404:
 *         description: Booking not found
 */
router.get("/:id", authenticate, bookingController.getBookingById);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking (with automatic conflict detection)
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [court_id, customer_name, customer_phone, booking_date, start_time, end_time]
 *             properties:
 *               court_id:
 *                 type: integer
 *                 example: 1
 *               customer_name:
 *                 type: string
 *                 example: Nguyen Van A
 *               customer_phone:
 *                 type: string
 *                 example: "0901234567"
 *               booking_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-15"
 *               start_time:
 *                 type: string
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 example: "10:00"
 *               note:
 *                 type: string
 *                 example: "Bring extra water bottles"
 *     responses:
 *       201:
 *         description: Booking created
 *       409:
 *         description: Time slot conflict — court is already booked
 */
router.post("/", authenticate, bookingValidation, bookingController.createBooking);

/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     summary: Update booking status (confirm, cancel, complete)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", authenticate, bookingController.updateBookingStatus);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking (admin/staff only)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking cancelled
 */
router.delete("/:id", authenticate, authorize("admin", "staff"), bookingController.cancelBooking);

module.exports = router;
