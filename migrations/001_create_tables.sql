-- ============================================================
-- BCMS Database Migration: Create all tables
-- File   : migrations/001_create_tables.sql
-- Author : Nhat Thai
-- Desc   : Initial schema for the Badminton Court Management System.
--          Run this file once to set up the database from scratch.
-- ============================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS bcms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bcms_db;

-- ── Users ──────────────────────────────────────────────────────────────────
-- Stores all system users: admin, staff, and court owners.
CREATE TABLE IF NOT EXISTS users (
  user_id    INT          AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  phone      VARCHAR(15)  NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,             -- bcrypt-hashed
  role       ENUM('admin', 'staff', 'owner', 'customer') NOT NULL DEFAULT 'customer',
  reset_token VARCHAR(255) NULL,
  reset_token_expiry DATETIME NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── Courts ─────────────────────────────────────────────────────────────────
-- Represents physical badminton courts at the facility.
CREATE TABLE IF NOT EXISTS courts (
  court_id   INT          AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  status     ENUM('available', 'maintenance', 'inactive') NOT NULL DEFAULT 'available',
  price_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 100000.00,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);



-- ── Bookings ───────────────────────────────────────────────────────────────
-- Core table: records each court reservation.
CREATE TABLE IF NOT EXISTS bookings (
  booking_id      INT          AUTO_INCREMENT PRIMARY KEY,
  court_id        INT          NOT NULL,
  customer_name   VARCHAR(100) NOT NULL,
  customer_phone  VARCHAR(15)  NOT NULL,
  booking_date    DATE         NOT NULL,
  start_time      TIME         NOT NULL,
  end_time        TIME         NOT NULL,
  total_price     DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status          ENUM('pending', 'confirmed', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
  note            TEXT,
  created_by      INT,                                   -- FK to users.user_id (the staff who created it)
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (court_id)   REFERENCES courts(court_id)  ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(user_id)    ON DELETE SET NULL,
  -- Prevent double-booking: unique constraint on court + date + time window
  -- (handled in application logic for flexibility, but index improves query speed)
  INDEX idx_booking_date_court (court_id, booking_date, start_time, end_time)
);

-- ── Payments ───────────────────────────────────────────────────────────────
-- Tracks payment records for each confirmed booking.
CREATE TABLE IF NOT EXISTS payments (
  payment_id     INT          AUTO_INCREMENT PRIMARY KEY,
  booking_id     INT          NOT NULL UNIQUE,           -- One payment per booking
  amount         DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'bank_transfer', 'momo') NOT NULL DEFAULT 'cash',
  payment_status ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
  paid_at        TIMESTAMP    NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA: Default admin account + sample courts
-- ============================================================

-- Default admin user (password: Admin@123 — must be changed in production)
INSERT IGNORE INTO users (full_name, phone, email, password, role)
VALUES (
  'Nhat Thai',
  '0901234567',
  'nhatthaiuit@gmail.com',
  '$2b$10$yaorL.WnhesJkP3AiQ2fd.TX0vpSrXUOqG48s4pN2x6iDjp01ogu2', -- Admin@123
  'admin'
);

-- Sample courts
INSERT IGNORE INTO courts (name, status) VALUES
  ('Court 1', 'available'),
  ('Court 2', 'available'),
  ('Court 3', 'available'),
  ('Court 4', 'available');


