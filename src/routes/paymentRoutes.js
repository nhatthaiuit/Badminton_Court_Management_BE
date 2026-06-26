/**
 * @file src/routes/paymentRoutes.js
 * @description Routes for payment processing.
 */

const express = require("express");
const { mockPay } = require("../controllers/paymentController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

// Apply auth middleware to all routes below
router.use(protect);

router.post("/mock-pay", mockPay);

module.exports = router;
