/**
 * @file src/controllers/userController.js
 * @description User management operations (admin-restricted).
 */

const pool = require("../config/database");
const { asyncHandler, successResponse, createError } = require("../utils/helpers");

/**
 * @route   GET /api/v1/users
 * @desc    Get all registered users (no passwords)
 * @access  Private (admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    "SELECT user_id, full_name, email, phone, role, created_at FROM users ORDER BY created_at DESC"
  );
  res.json(successResponse("Users retrieved", users, { total: users.length }));
});

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get a single user by ID
 * @access  Private (admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [users] = await pool.query(
    "SELECT user_id, full_name, email, phone, role, created_at FROM users WHERE user_id = ?",
    [id]
  );

  if (users.length === 0) {
    throw createError(`User with ID ${id} not found.`, 404);
  }

  res.json(successResponse("User retrieved", users[0]));
});

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update a user's role
 * @access  Private (admin)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ["admin", "staff", "owner"];
  if (!validRoles.includes(role)) {
    throw createError(`Invalid role. Must be one of: ${validRoles.join(", ")}`, 400);
  }

  const [existing] = await pool.query(
    "SELECT user_id FROM users WHERE user_id = ?", [id]
  );
  if (existing.length === 0) {
    throw createError(`User with ID ${id} not found.`, 404);
  }

  await pool.query("UPDATE users SET role = ? WHERE user_id = ?", [role, id]);

  const [updated] = await pool.query(
    "SELECT user_id, full_name, email, phone, role FROM users WHERE user_id = ?", [id]
  );

  res.json(successResponse("User role updated successfully", updated[0]));
});

module.exports = { getAllUsers, getUserById, updateUserRole };
