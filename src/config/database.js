/**
 * @file src/config/database.js
 * @description MySQL connection pool configuration.
 *              Uses mysql2/promise for async/await support throughout the application.
 *              Connection pooling improves performance by reusing database connections.
 */

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

/**
 * MySQL connection pool
 * - connectionLimit: max number of concurrent connections
 * - waitForConnections: queue requests when pool is full instead of failing
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bcms_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return dates as strings to avoid timezone conversion issues
  dateStrings: true,
});

/**
 * Test the database connection on startup.
 * Logs success or exits the process if connection fails.
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Database connected successfully");
    connection.release(); // Always release back to pool
  } catch (error) {
    console.error("❌ Failed to connect to MySQL:", error.message);
    process.exit(1); // Stop server if DB is unreachable
  }
};

testConnection();

module.exports = pool;
