/**
 * @file src/routes/index.js
 * @description Central router that mounts all feature-specific sub-routers.
 *              All routes are prefixed with /api/v1 from server.js.
 */

const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const courtRoutes = require("./courts");
const bookingRoutes = require("./bookings");
const userRoutes = require("./users");
const statsRoutes = require("./stats");
const paymentRoutes = require("./paymentRoutes");

// Mount sub-routers onto their respective path prefixes
router.get("/", (req, res) => {
  res.json({ success: true, message: "Welcome to BCMS API v1. Docs at /api-docs" });
});
router.use("/auth", authRoutes);        // Authentication: login, register, profile
router.use("/courts", courtRoutes);     // Court management: CRUD operations
router.use("/bookings", bookingRoutes); // Booking management: create, update, cancel
router.use("/users", userRoutes);       // User management: admin-only operations
router.use("/stats", statsRoutes);      // Dashboard analytics: revenue, occupancy
router.use("/payments", paymentRoutes); // Payment gateways

module.exports = router;
