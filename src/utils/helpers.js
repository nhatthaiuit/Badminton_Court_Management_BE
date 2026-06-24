/**
 * @file src/utils/helpers.js
 * @description Shared utility functions used across the application.
 */

/**
 * Wrap an async route handler to automatically catch errors
 * and forward them to Express's global error handler via next(err).
 * Avoids writing try/catch blocks in every controller.
 *
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get("/courts", asyncHandler(async (req, res) => {
 *   const courts = await CourtModel.getAll();
 *   res.json({ success: true, data: courts });
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create a standardized API success response object.
 * @param {string} message - Human-readable success message
 * @param {*} data - The response payload
 * @param {object} [meta] - Optional metadata (pagination, totals, etc.)
 * @returns {object}
 */
const successResponse = (message, data = null, meta = null) => ({
  success: true,
  message,
  ...(data !== null && { data }),
  ...(meta !== null && { meta }),
});

/**
 * Create an AppError with a specific HTTP status code.
 * Use this to throw controlled errors from controllers/services.
 *
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error}
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true; // Flag to distinguish app errors from unexpected crashes
  return error;
};

module.exports = { asyncHandler, successResponse, createError };
