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
 * @access  Private (admin, owner)
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const currentRole = req.user.role;

  const validRoles = ["admin", "staff", "owner", "customer"];
  if (!validRoles.includes(role)) {
    throw createError(`Invalid role. Must be one of: ${validRoles.join(", ")}`, 400);
  }

  const [existing] = await pool.query(
    "SELECT user_id, role FROM users WHERE user_id = ?", [id]
  );
  if (existing.length === 0) {
    throw createError(`User with ID ${id} not found.`, 404);
  }

  const targetRole = existing[0].role;

  let hasPermission = false;
  if (currentRole === "admin") {
    hasPermission = true;
  } else if (currentRole === "owner") {
    // Owner can only change roles of staff and customer, and can only assign staff or customer
    if (["staff", "customer"].includes(targetRole) && ["staff", "customer"].includes(role)) {
      hasPermission = true;
    }
  }

  if (!hasPermission) {
    throw createError(`Role '${currentRole}' is not authorized to change role of '${targetRole}' to '${role}'.`, 403);
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

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update a user's info (name, email, phone, password)
 * @access  Private (admin, owner, staff)
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, password } = req.body;
  const currentRole = req.user.role;

  const [existing] = await pool.query(
    "SELECT user_id, role, password FROM users WHERE user_id = ?", [id]
  );
  if (existing.length === 0) {
    throw createError(`User with ID ${id} not found.`, 404);
  }

  const targetRole = existing[0].role;

  let hasPermission = false;
  if (currentRole === "admin") {
    hasPermission = true;
  } else if (currentRole === "owner") {
    if (["staff", "customer"].includes(targetRole)) hasPermission = true;
  } else if (currentRole === "staff") {
    if (targetRole === "customer") hasPermission = true;
  }

  if (!hasPermission) {
    throw createError(`Role '${currentRole}' is not authorized to edit user with role '${targetRole}'.`, 403);
  }

  // Check if phone is already registered by another user
  if (phone) {
    const [phoneCheck] = await pool.query("SELECT user_id FROM users WHERE phone = ? AND user_id != ?", [phone, id]);
    if (phoneCheck.length > 0) {
      throw createError("Phone number is already registered to another user.", 400);
    }
  }

  let updateFields = [];
  let updateValues = [];

  if (full_name) { updateFields.push("full_name = ?"); updateValues.push(full_name); }
  if (email) { 
    if (!email.endsWith("@gmail.com")) {
      throw createError("Email must end with @gmail.com", 400);
    }
    updateFields.push("email = ?"); 
    updateValues.push(email); 
  }
  if (phone) { updateFields.push("phone = ?"); updateValues.push(phone); }
  if (password) { 
    const hashedPassword = await bcrypt.hash(password, 12);
    updateFields.push("password = ?"); 
    updateValues.push(hashedPassword); 
  }

  if (updateFields.length > 0) {
    updateValues.push(id);
    await pool.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE user_id = ?`,
      updateValues
    );
  }

  const [updatedUser] = await pool.query(
    "SELECT user_id, full_name, email, phone, role, created_at FROM users WHERE user_id = ?",
    [id]
  );

  res.json(successResponse("User updated successfully", updatedUser[0]));
});

module.exports = { getAllUsers, getUserById, updateUserRole, createUser, updateUser };
