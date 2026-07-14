/**
 * @file src/middlewares/auth.js
 * @description JWT authentication middleware.
 *              Verifies the Bearer token from the Authorization header,
 *              attaches the decoded user payload to req.user, and calls next().
 *              Roles-based authorization helper is also exported here.
 */

const jwt = require("jsonwebtoken");

/**
 * Middleware: Verify JWT token from Authorization header.
 * Usage: Add `authenticate` before any protected route handler.
 */
const authenticate = (req, res, next) => {
  // Extract token from "Authorization: Bearer <token>" header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    // Verify token signature and expiry using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded payload (id, role, phone) to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

/**
 * Middleware factory: Restrict access by user role(s).
 * Usage: authorize("admin") or authorize("admin", "staff")
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have permission to perform this action.",
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
