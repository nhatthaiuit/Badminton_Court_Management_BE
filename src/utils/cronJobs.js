/**
 * @file src/utils/cronJobs.js
 * @description Background tasks and cron jobs for the system.
 */

const pool = require("../config/database");

/**
 * Initializes and starts all cron jobs.
 * @param {Object} io - Socket.io instance for emitting events
 */
const startCronJobs = (io) => {
  // 1. Auto-cancel pending bookings after 15 minutes
  // Runs every 1 minute (60000 ms)
  setInterval(async () => {
    try {
      // Find all pending bookings older than 15 minutes
      // In MySQL, we can use TIMESTAMPDIFF(MINUTE, created_at, NOW()) > 15
      const query = `
        SELECT booking_id 
        FROM bookings 
        WHERE status = 'pending' 
          AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= 15
      `;
      
      const [expiredBookings] = await pool.query(query);

      if (expiredBookings.length > 0) {
        const bookingIds = expiredBookings.map(b => b.booking_id);
        
        // Update their status to cancelled
        await pool.query(
          `UPDATE bookings SET status = 'cancelled', note = CONCAT(IFNULL(note, ''), '\n[System]: Automatically cancelled due to payment timeout.') WHERE booking_id IN (?)`,
          [bookingIds]
        );

        console.log(`[Cron] Auto-cancelled ${expiredBookings.length} expired booking(s): ${bookingIds.join(', ')}`);

        // Emit socket event to notify clients to refresh their schedules
        if (io) {
          io.emit("schedule_updated");
        }
      }
    } catch (error) {
      console.error("[Cron Error] Auto-cancel bookings failed:", error);
    }
  }, 60000); // 60,000 ms = 1 minute

  console.log("⏰ Cron jobs initialized.");
};

module.exports = {
  startCronJobs,
};
