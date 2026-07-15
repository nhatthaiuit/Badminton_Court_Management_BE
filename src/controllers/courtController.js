/**
 * @file src/controllers/courtController.js
 * @description CRUD operations for court management.
 */

const pool = require("../config/database");
const { asyncHandler, successResponse, createError } = require("../utils/helpers");
const { validationResult } = require("express-validator");

/**
 * @route   GET /api/v1/courts
 * @desc    Get all courts, optionally filtered by status
 * @access  Private (all authenticated users)
 */
const getAllCourts = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let query = "SELECT * FROM courts";
  const params = [];

  // Apply status filter if provided
  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }

  query += " ORDER BY court_id ASC";

  const [courts] = await pool.query(query, params);
  res.json(successResponse("Courts retrieved", courts));
});

/**
 * @route   GET /api/v1/courts/:id
 * @desc    Get a single court by ID
 * @access  Private
 */
const getCourtById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [courts] = await pool.query("SELECT * FROM courts WHERE court_id = ?", [id]);

  if (courts.length === 0) {
    throw createError(`Court with ID ${id} not found.`, 404);
  }

  res.json(successResponse("Court retrieved", courts[0]));
});

/**
 * @route   POST /api/v1/courts
 * @desc    Create a new court
 * @access  Private (admin, owner)
 */
const createCourt = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, status = "available", price_per_hour = 100000.00 } = req.body;

  const [result] = await pool.query(
    "INSERT INTO courts (name, status, price_per_hour) VALUES (?, ?, ?)",
    [name, status, price_per_hour]
  );

  const [newCourt] = await pool.query(
    "SELECT * FROM courts WHERE court_id = ?",
    [result.insertId]
  );

  res.status(201).json(successResponse("Court created successfully", newCourt[0]));
});

/**
 * @route   PUT /api/v1/courts/:id
 * @desc    Update court name and/or status
 * @access  Private (admin, owner)
 */
const updateCourt = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { name, status, price_per_hour } = req.body;

  // Verify court exists before updating
  const [existing] = await pool.query("SELECT * FROM courts WHERE court_id = ?", [id]);
  if (existing.length === 0) {
    throw createError(`Court with ID ${id} not found.`, 404);
  }

  // Build dynamic update query (only update fields that were provided)
  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push("name = ?"); params.push(name); }
  if (status !== undefined) { updates.push("status = ?"); params.push(status); }
  if (price_per_hour !== undefined) { updates.push("price_per_hour = ?"); params.push(price_per_hour); }

  if (updates.length === 0) {
    return res.status(400).json({ success: false, message: "No fields to update." });
  }

  params.push(id); // WHERE clause parameter
  await pool.query(`UPDATE courts SET ${updates.join(", ")} WHERE court_id = ?`, params);

  const [updatedCourt] = await pool.query("SELECT * FROM courts WHERE court_id = ?", [id]);

  res.json(successResponse("Court updated successfully", updatedCourt[0]));
});

/**
 * @route   DELETE /api/v1/courts/:id
 * @desc    Soft-delete a court (sets status to inactive)
 * @access  Private (admin only)
 */
const deleteCourt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await pool.query("SELECT * FROM courts WHERE court_id = ?", [id]);
  if (existing.length === 0) {
    throw createError(`Court with ID ${id} not found.`, 404);
  }

  // Hard delete
  try {
    await pool.query("DELETE FROM courts WHERE court_id = ?", [id]);
    res.json(successResponse(`Court ${id} has been deleted completely.`));
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete court with existing booking history. Please set its status to 'inactive' instead." 
      });
    }
    throw error;
  }
});

module.exports = { getAllCourts, getCourtById, createCourt, updateCourt, deleteCourt };
