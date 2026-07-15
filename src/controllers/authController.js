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
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * Generate a signed JWT token for an authenticated user.
 * @param {object} user - User object containing id, phone, email, role
 * @returns {string} Signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.user_id, phone: user.phone, role: user.role },
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

  const { full_name, email, phone, password } = req.body;
  const role = "customer"; // Force role to customer for public registration

  if (!email || !email.endsWith("@gmail.com")) {
    throw createError("Email must end with @gmail.com", 400);
  }

  // Check if phone is already registered
  const [existing] = await pool.query(
    "SELECT user_id FROM users WHERE phone = ?",
    [phone]
  );
  if (existing.length > 0) {
    throw createError("Phone number is already registered.", 400);
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

  const { phone, password } = req.body;

  // Find user by phone
  const [users] = await pool.query(
    "SELECT * FROM users WHERE phone = ?",
    [phone]
  );

  if (users.length === 0) {
    throw createError("Invalid phone number or password.", 401);
  }

  const user = users[0];

  // Compare submitted password with stored hash
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError("Invalid phone number or password.", 401);
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

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const forgotPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { phone } = req.body;

  // Check if user exists
  const [users] = await pool.query("SELECT user_id, email, full_name FROM users WHERE phone = ?", [phone]);
  if (users.length === 0) {
    throw createError("User with this phone number not found.", 404);
  }

  const user = users[0];
  if (!user.email) {
    throw createError("No email associated with this account. Cannot recover password.", 400);
  }

  // Generate random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save to DB
  await pool.query(
    "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?",
    [hashedToken, tokenExpiry, user.user_id]
  );

  // Send Email
  const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: `"BCMS Support" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Request",
    html: `
      <h3>Hello ${user.full_name},</h3>
      <p>You requested a password reset for your BCMS account.</p>
      <p>Please click the link below to reset your password. This link is valid for 10 minutes.</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json(successResponse("Password reset link sent to your email."));
  } catch (error) {
    console.error("Email send error:", error);
    // Remove token if email failed
    await pool.query(
      "UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?",
      [user.user_id]
    );
    throw createError("There was an error sending the email. Try again later.", 500);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { token, new_password } = req.body;

  // Hash the token from the user to compare with DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user by token and check expiry
  const [users] = await pool.query(
    "SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
    [hashedToken]
  );

  if (users.length === 0) {
    throw createError("Token is invalid or has expired", 400);
  }

  const user = users[0];
  const newHashedPassword = await bcrypt.hash(new_password, 12);

  // Update password and clear token
  await pool.query(
    "UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?",
    [newHashedPassword, user.user_id]
  );

  res.json(successResponse("Password has been reset successfully. You can now login."));
});

module.exports = {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
};
