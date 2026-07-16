/**
 * @file src/routes/stats.js
 * @description Dashboard statistics routes — revenue, booking counts, court occupancy.
 *              These endpoints power the reporting dashboard for court owners/admins.
 */

const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const { authenticate, authorize } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Statistics
 *   description: Dashboard analytics and revenue reporting
 */

/**
 * @swagger
 * /stats/overview:
 *   get:
 *     summary: Get today's overview (total bookings, revenue, court status) (Admin/Owner/Staff only)
 *     tags: [Statistics]
 *     responses:
 *       200:
 *         description: Dashboard overview data
 */
router.get("/overview", authenticate, authorize("admin", "owner", "staff"), statsController.getOverview);

/**
 * @swagger
 * /stats/revenue:
 *   get:
 *     summary: Get daily revenue for a date range (Admin/Owner only)
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD). Defaults to 7 days ago.
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD). Defaults to today.
 *     responses:
 *       200:
 *         description: Daily revenue breakdown
 */
router.get("/revenue", authenticate, authorize("admin", "owner"), statsController.getRevenue);

/**
 * @swagger
 * /stats/court-occupancy:
 *   get:
 *     summary: Get court occupancy rate for a given date (Admin/Owner/Staff only)
 *     tags: [Statistics]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to analyze (defaults to today)
 *     responses:
 *       200:
 *         description: Occupancy data per court
 */
router.get("/court-occupancy", authenticate, authorize("admin", "owner", "staff"), statsController.getCourtOccupancy);

module.exports = router;
