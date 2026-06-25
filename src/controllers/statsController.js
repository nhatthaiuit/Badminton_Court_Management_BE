/**
 * @file src/controllers/statsController.js
 * @description Dashboard analytics: overview, revenue trends, and court occupancy.
 *              Uses SQL aggregation queries to compute business metrics.
 */

const pool = require("../config/database");
const { asyncHandler, successResponse } = require("../utils/helpers");

/**
 * @route   GET /api/v1/stats/overview
 * @desc    Today's key metrics: total bookings, revenue, court status counts
 * @access  Private
 */
const getOverview = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Run all queries in parallel for performance
  const [
    [todayBookings],
    [todayRevenue],
    [courtStatus],
    [recentBookings],
    [maintenanceBlocks],
  ] = await Promise.all([
    // Count of today's bookings by status
    pool.query(
      `SELECT 
         COUNT(*) AS total,
         SUM(status = 'confirmed') AS confirmed,
         SUM(status = 'pending')   AS pending,
         SUM(status = 'cancelled') AS cancelled,
         SUM(status = 'completed') AS completed
       FROM bookings
       WHERE booking_date = ?`,
      [today]
    ),

    // Today's total confirmed/completed revenue
    pool.query(
      `SELECT COALESCE(SUM(total_price), 0) AS total_revenue
       FROM bookings
       WHERE booking_date = ? AND status IN ('confirmed', 'completed')`,
      [today]
    ),

    // Count of courts by their current status
    pool.query(
      `SELECT status, COUNT(*) AS count
       FROM courts
       GROUP BY status`
    ),

    // 5 most recent bookings for the activity feed
    pool.query(
      `SELECT b.booking_id, b.customer_name, b.start_time, b.end_time, b.status,
              c.name AS court_name
       FROM bookings b
       LEFT JOIN courts c ON b.court_id = c.court_id
       WHERE b.booking_date = ?
       ORDER BY b.created_at DESC
       LIMIT 5`,
      [today]
    ),

    // Count of maintenance blocks today
    pool.query(
      `SELECT COUNT(*) AS count
       FROM bookings
       WHERE booking_date = ? AND (customer_name = 'Maintenance Block' OR note LIKE '[MAINTENANCE]%') AND status NOT IN ('cancelled')`,
      [today]
    ),
  ]);

  // Transform court status array into a key-value map
  const courtMap = courtStatus.reduce((acc, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {});

  res.json(
    successResponse("Overview retrieved", {
      date: today,
      bookings: todayBookings[0],
      revenue: {
        today: parseFloat(todayRevenue[0].total_revenue),
        currency: "VND",
      },
      courts: {
        available: courtMap["available"] || 0,
        maintenance: maintenanceBlocks[0].count || 0,
        inactive: courtMap["inactive"] || 0,
      },
      recentActivity: recentBookings,
    })
  );
});

/**
 * @route   GET /api/v1/stats/revenue
 * @desc    Daily revenue aggregation for a date range (default: last 7 days)
 * @access  Private (admin, owner)
 */
const getRevenue = asyncHandler(async (req, res) => {
  // Default to last 7 days if no range provided
  const to = req.query.to || new Date().toISOString().split("T")[0];
  const from =
    req.query.from ||
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [rows] = await pool.query(
    `SELECT 
       booking_date                               AS date,
       COUNT(*)                                   AS total_bookings,
       SUM(status IN ('confirmed','completed'))   AS paid_bookings,
       COALESCE(SUM(
         CASE WHEN status IN ('confirmed','completed') THEN total_price ELSE 0 END
       ), 0)                                      AS revenue
     FROM bookings
     WHERE booking_date BETWEEN ? AND ?
     GROUP BY booking_date
     ORDER BY booking_date ASC`,
    [from, to]
  );

  const totalRevenue = rows.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

  res.json(
    successResponse("Revenue retrieved", {
      period: { from, to },
      totalRevenue,
      currency: "VND",
      breakdown: rows,
    })
  );
});

/**
 * @route   GET /api/v1/stats/court-occupancy
 * @desc    Hourly occupancy per court for a given date
 * @access  Private
 */
const getCourtOccupancy = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split("T")[0];

  // Operating hours: 09:00 – 21:00 = 12 available hours per court
  const OPERATING_HOURS = 12;

  const [rows] = await pool.query(
    `SELECT 
       c.court_id,
       c.name                                      AS court_name,
       c.status                                    AS court_status,
       COUNT(b.booking_id)                         AS bookings_count,
       COALESCE(
         SUM(TIMESTAMPDIFF(HOUR, b.start_time, b.end_time)), 0
       )                                           AS booked_hours
     FROM courts c
     LEFT JOIN bookings b 
       ON b.court_id = c.court_id
       AND b.booking_date = ?
       AND b.status NOT IN ('cancelled')
     GROUP BY c.court_id, c.name, c.status
     ORDER BY c.court_id ASC`,
    [date]
  );

  // Calculate occupancy % for each court
  const courtOccupancy = rows.map((row) => ({
    ...row,
    available_hours: OPERATING_HOURS,
    occupancy_rate:
      row.court_status === "maintenance"
        ? 100 // Maintenance courts are considered fully occupied
        : Math.min(
            Math.round((row.booked_hours / OPERATING_HOURS) * 100),
            100
          ),
  }));

  res.json(
    successResponse("Court occupancy retrieved", {
      date,
      operatingHours: OPERATING_HOURS,
      courts: courtOccupancy,
    })
  );
});

module.exports = { getOverview, getRevenue, getCourtOccupancy };
