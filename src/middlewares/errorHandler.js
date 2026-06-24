/**
 * @file src/middlewares/errorHandler.js
 * @description Global error handling middleware.
 *              Must be registered LAST in Express middleware chain.
 *              Catches all errors passed via next(err) and returns a consistent JSON response.
 */

/**
 * Global error handler middleware
 * @param {Error} err - The error object (may include statusCode and isOperational)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error if no status code is set
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log full error details in development for easier debugging
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${req.method} ${req.path} → ${statusCode}: ${message}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only include stack trace in development mode
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
