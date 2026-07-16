/**
 * @file src/routes/paymentRoutes.js
 * @description Routes for payment processing.
 */

const express = require("express");
const { mockPay } = require("../controllers/paymentController");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

// Apply auth middleware to all routes below
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing simulation
 */

/**
 * @swagger
 * /payments/mock-pay:
 *   post:
 *     summary: Simulate a successful payment for a pending booking (Any logged-in user)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [booking_id]
 *             properties:
 *               booking_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Payment successful, booking confirmed
 *       400:
 *         description: Invalid booking or payment timeout
 *       404:
 *         description: Booking not found
 */

router.post("/mock-pay", mockPay);

module.exports = router;
