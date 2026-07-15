# Badminton Court Management System - Backend

![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

A robust Node.js/Express REST API serving the Badminton Court Management System.

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

## 🌐 Deployment (Render.com)

This backend can be easily deployed to [Render](https://render.com/):
1. Push your code to GitHub.
2. Create a "Web Service" in Render.
3. Connect your GitHub repository.
4. Set the Build Command to `npm install` and Start Command to `node server.js` (or `npm start`).
5. Set up your Environment Variables (especially the Database connection URL pointing to your managed MySQL like Aiven).
6. Deploy!
