# Badminton Court Management System - Backend

![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

A robust Node.js/Express REST API serving the Badminton Court Management System.

## 📖 Comprehensive Documentation
For detailed system architecture, Database ERD (Entity Relationship Diagram), API Flowcharts, and full project descriptions, please visit our **[Notion Workspace](https://app.notion.com/p/Badminton-Court-Management-System-3849f49bca6d8032a1b6d16c2a71ce08?source=copy_link)**.

## 🌐 Live API Endpoint
**[Insert your live Render link here once deployed]**

## 🚀 Features

- **Double-Booking Prevention**: Advanced MySQL queries to prevent overlapping time slots even with concurrent requests.
- **WebSocket Integration**: Pushes real-time schedule updates to all connected clients whenever a booking changes status.
- **Automated Cron Jobs**: A background task continuously monitors pending bookings and automatically cancels them if unpaid for 15 minutes.
- **JWT Authentication**: Role-based access control (Admin, Staff, Customer).
- **Relational Database Model**: Well-structured schema to manage courts, bookings, and users.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 8.0 (mysql2 promise wrapper)
- **WebSockets**: Socket.io
- **Auth**: JSON Web Tokens (jsonwebtoken), bcryptjs
- **Background Jobs**: node-cron

## 🗄️ Database Schema

- `users`: Manages staff and admin credentials.
- `courts`: Stores court names, statuses (available/maintenance), and `price_per_hour`.
- `bookings`: Core table tracking customer details, court_id, start/end times, and payment status.
- `payments`: Tracks transaction records (optional usage for manual verification).

## 💻 Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Badminton_Court_Management_BE.git
   cd Badminton_Court_Management_BE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Database & Environment**
   Create a `.env` file in the root directory:
   ```env
   PORT=5001
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=bcms_db
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Initialize Database**
   Run the SQL scripts located in the `/migrations` folder on your local MySQL server to create the schema and seed initial data.

5. **Start the server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
.
├── migrations/      # Database initialization SQL scripts
├── src/
│   ├── config/      # Database connection & env configurations
│   ├── controllers/ # Request handlers (Auth, Bookings, Courts, etc.)
│   ├── middlewares/ # Express middlewares (Auth, Error handling)
│   ├── models/      # Data access layer (if separated)
│   ├── routes/      # Express API routes definitions
│   └── utils/       # Utility functions and Cron Jobs
└── server.js        # Application entry point & Socket.io setup
```
