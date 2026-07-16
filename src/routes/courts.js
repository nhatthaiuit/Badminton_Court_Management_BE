/**
 * @file src/routes/courts.js
 * @description Court management routes: CRUD operations for badminton courts.
 *              Admin/owner only for write operations; staff can read.
 */

const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const courtController = require("../controllers/courtController");
const { authenticate, authorize } = require("../middlewares/auth");

// ── Validation rules ─────────────────────────────────────────────────────────
const courtValidation = [
  body("name").trim().notEmpty().withMessage("Court name is required"),
  body("status")
    .optional()
    .isIn(["available", "maintenance", "inactive"])
    .withMessage("Status must be: available, maintenance, or inactive"),
];

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * tags:
 *   name: Courts
 *   description: Badminton court management
 */

/**
 * @swagger
 * /courts:
 *   get:
 *     summary: Get all courts
 *     tags: [Courts]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, maintenance, inactive]
 *         description: Filter courts by status
 *     responses:
 *       200:
 *         description: List of all courts
 */
router.get("/", authenticate, courtController.getAllCourts);

/**
 * @swagger
 * /courts/{id}:
 *   get:
 *     summary: Get a single court by ID
 *     tags: [Courts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Court details
 *       404:
 *         description: Court not found
 */
router.get("/:id", authenticate, courtController.getCourtById);

/**
 * @swagger
 * /courts:
 *   post:
 *     summary: Create a new court (Admin/Owner only)
 *     tags: [Courts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Court 1
 *               status:
 *                 type: string
 *                 enum: [available, maintenance, inactive]
 *                 default: available
 *     responses:
 *       201:
 *         description: Court created
 *       403:
 *         description: Forbidden
 */
router.post("/", authenticate, authorize("admin", "owner"), courtValidation, courtController.createCourt);

/**
 * @swagger
 * /courts/{id}:
 *   put:
 *     summary: Update court details (Admin/Owner only)
 *     tags: [Courts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [available, maintenance, inactive]
 *     responses:
 *       200:
 *         description: Court updated
 *       404:
 *         description: Court not found
 */
router.put("/:id", authenticate, authorize("admin", "owner"), courtValidation, courtController.updateCourt);

/**
 * @swagger
 * /courts/{id}:
 *   delete:
 *     summary: Delete a court (Admin only)
 *     tags: [Courts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Court deleted
 *       404:
 *         description: Court not found
 */
router.delete("/:id", authenticate, authorize("admin"), courtController.deleteCourt);

module.exports = router;
