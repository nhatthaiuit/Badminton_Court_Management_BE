/**
 * @file src/controllers/authController.js
 * @description Handles user registration, login, and profile retrieval.
 *              Uses bcryptjs for password hashing and jsonwebtoken for JWT generation.
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const pool = require("../config/database");
const { asyncHandler, successResponse, createError } = require("../utils/helpers");

/**
 * Generate a signed JWT token for an authenticated user.
 * @param {object} user - User object containing id, email, role
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  // Check for validation errors from express-validator middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { full_name, email, phone, password, role = "customer" } = req.body;

  // Check if email is already registered
  const [existing] = await pool.query(
    "SELECT user_id FROM users WHERE email = ?",
    [email]
  );
  if (existing.length > 0) {
    throw createError("Email is already registered.", 400);
  }

  // Hash password with bcrypt (salt rounds = 12 for security)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Insert new user into database
  const [result] = await pool.query(
    "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
    [full_name, email, phone, hashedPassword, role]
  );

  // Fetch the created user to return (excluding password)
  const [newUser] = await pool.query(
    "SELECT user_id, full_name, email, phone, role, created_at FROM users WHERE user_id = ?",
    [result.insertId]
  );

  const token = generateToken(newUser[0]);

  res.status(201).json(
    successResponse("Registration successful", { user: newUser[0], token })
  );
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  // Find user by email
  const [users] = await pool.query(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (users.length === 0) {
    throw createError("Invalid email or password.", 401);
  }

  const user = users[0];

  // Compare submitted password with stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError("Invalid email or password.", 401);
  }

  // Generate JWT token
  const token = generateToken(user);

  // Return user data without password field
  const { password: _, ...userWithoutPassword } = user;

  res.json(
    successResponse("Login successful", { user: userWithoutPassword, token })
  );
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user's profile
 * @access  Private (requires JWT)
 */
const getProfile = asyncHandler(async (req, res) => {
  // req.user is set by the authenticate middleware
  const [users] = await pool.query(
    "SELECT user_id, full_name, email, phone, role, created_at FROM users WHERE user_id = ?",
    [req.user.id]
  );

  if (users.length === 0) {
    throw createError("User not found.", 404);
  }

  res.json(successResponse("Profile retrieved", users[0]));
});

module.exports = { register, login, getProfile };
