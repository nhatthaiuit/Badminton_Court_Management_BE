# 🏸 BCMS — Badminton Court Management System (Backend)

> RESTful API server for BCMS built with **Node.js**, **Express**, and **MySQL**.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://mysql.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)

---

## ✨ Features

- **JWT Authentication** — Secure login with role-based access control (admin / staff / owner)
- **Court Management** — Full CRUD for badminton courts
- **Booking Management** — Real-time double-booking conflict detection
- **Swagger API Docs** — Interactive API documentation at `/api-docs`
- **Global Error Handling** — Consistent JSON error responses across all endpoints

---

## 🛠 Tech Stack

| Layer       | Technology            |
|-------------|-----------------------|
| Runtime     | Node.js 18+           |
| Framework   | Express.js            |
| Database    | MySQL 8.0             |
| ORM/Driver  | mysql2/promise        |
| Auth        | JWT (jsonwebtoken)    |
| Password    | bcryptjs              |
| API Docs    | Swagger (swagger-jsdoc + swagger-ui-express) |
| Validation  | express-validator     |
| Logging     | morgan                |
| Dev Tool    | nodemon               |

---

## 📁 Project Structure

```
├── migrations/
│   └── 001_create_tables.sql   # Database schema + seed data
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection pool
│   │   └── swagger.js           # OpenAPI spec configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── courtController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── auth.js              # JWT verify + role authorization
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   ├── index.js             # Central router
│   │   ├── auth.js
│   │   ├── bookings.js
│   │   ├── courts.js
│   │   └── users.js
│   └── utils/
│       └── helpers.js           # asyncHandler, createError, successResponse
├── .env.example
├── server.js                    # App entry point
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MySQL 8.0 running locally or remote

### 1. Clone the repository
```bash
git clone https://github.com/nhatthaiuit/Badminton_Court_Management_BE.git
cd Badminton_Court_Management_BE
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
```

### 4. Run database migration
```bash
mysql -u root -p < migrations/001_create_tables.sql
```

### 5. Start development server
```bash
npm run dev
```

Server starts at: `http://localhost:5000`

---

## 📖 API Documentation

Interactive Swagger UI available at:
```
http://localhost:5000/api-docs
```

### API Endpoints Overview

| Method | Endpoint                    | Description                  | Auth |
|--------|-----------------------------|------------------------------|------|
| POST   | `/api/v1/auth/register`     | Register new user            | ❌   |
| POST   | `/api/v1/auth/login`        | Login & get JWT token        | ❌   |
| GET    | `/api/v1/auth/me`           | Get current user profile     | ✅   |
| GET    | `/api/v1/courts`            | List all courts              | ✅   |
| POST   | `/api/v1/courts`            | Create court                 | ✅ admin |
| PUT    | `/api/v1/courts/:id`        | Update court                 | ✅ admin |
| DELETE | `/api/v1/courts/:id`        | Deactivate court             | ✅ admin |
| GET    | `/api/v1/bookings`          | List bookings (filterable)   | ✅   |
| POST   | `/api/v1/bookings`          | Create booking               | ✅   |
| PATCH  | `/api/v1/bookings/:id/status` | Update booking status      | ✅   |
| DELETE | `/api/v1/bookings/:id`      | Cancel booking               | ✅   |
| GET    | `/api/v1/users`             | List all users               | ✅ admin |

---

## ⚙️ Environment Variables

See [`.env.example`](.env.example) for all required variables.

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bcms_db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```
