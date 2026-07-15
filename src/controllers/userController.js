/**
 * @file src/controllers/userController.js
 * @description User management operations (admin-restricted).
 */

const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const { asyncHandler, successResponse, createError } = require("../utils/helpers");

/**
 * @route   GET /api/v1/users
 * @desc    Get all registered users (no passwords)
 * @access  Private (admin)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    "SELECT user_id, full_name, phone, role, created_at FROM users ORDER BY created_at DESC"
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
    "SELECT user_id, full_name, phone, role, created_at FROM users WHERE user_id = ?",
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
    "SELECT user_id, full_name, phone, role FROM users WHERE user_id = ?", [id]
  );

  res.json(successResponse("User role updated successfully", updated[0]));
});

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user with RBAC checks
 * @access  Private (admin, owner, staff)
 */
const createUser = asyncHandler(async (req, res) => {
  const { full_name, email, phone, password, role = "customer" } = req.body;
  const currentRole = req.user.role;

  // Validate allowed roles based on current user's role
  const allowedRolesForAdmin = ["admin", "owner", "staff", "customer"];
  const allowedRolesForOwner = ["staff", "customer"];
  const allowedRolesForStaff = ["customer"];

  let hasPermission = false;
  if (currentRole === "admin" && allowedRolesForAdmin.includes(role)) hasPermission = true;
  if (currentRole === "owner" && allowedRolesForOwner.includes(role)) hasPermission = true;
  if (currentRole === "staff" && allowedRolesForStaff.includes(role)) hasPermission = true;

  if (!hasPermission) {
    throw createError(`Role '${currentRole}' is not authorized to create a user with role '${role}'.`, 403);
  }

  if (!email || !email.endsWith("@gmail.com")) {
    throw createError("Email must end with @gmail.com", 400);
  }

  // Check if phone is already registered
  const [existing] = await pool.query("SELECT user_id FROM users WHERE phone = ?", [phone]);
  if (existing.length > 0) {
    throw createError("Phone number is already registered.", 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Insert new user
  const [result] = await pool.query(
    "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
    [full_name, email, phone, hashedPassword, role]
  );

  const [newUser] = await pool.query(
    "SELECT user_id, full_name, email, phone, role, created_at FROM users WHERE user_id = ?",
    [result.insertId]
  );

  res.status(201).json(successResponse("User created successfully", newUser[0]));
});

module.exports = { getAllUsers, getUserById, updateUserRole, createUser };
