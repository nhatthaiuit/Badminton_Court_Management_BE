/**
 * @file src/routes/auth.js
 * @description Authentication routes: register, login, and get current user profile.
 */

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { authenticate } = require("../middlewares/auth");

// ── Validation rules ─────────────────────────────────────────────────────────

const registerValidation = [
  body("full_name").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("phone")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be exactly 10 digits"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["admin", "staff", "owner", "customer"])
    .withMessage("Role must be admin, staff, owner, or customer"),
];

const loginValidation = [
  body("phone")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be exactly 10 digits"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidation = [
  body("phone")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be exactly 10 digits"),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token is required"),
  body("new_password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration, login, and profile management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, email, phone, password]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nguyen Van A
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@example.com
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [admin, staff, owner]
 *                 default: staff
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already exists
 */
router.post("/register", registerValidation, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful — returns JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginValidation, login);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the current authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user profile
 */
router.get("/profile", authenticate, getProfile);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *     responses:
 *       200:
 *         description: Reset link sent to email
 */
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "some_reset_token"
 *               new_password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password", resetPasswordValidation, resetPassword);

module.exports = router;
