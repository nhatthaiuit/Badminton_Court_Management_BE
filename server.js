/**
 * @file server.js
 * @description Entry point for the BCMS (Badminton Court Management System) REST API server.
 *              Initializes Express, applies global middlewares, mounts all routes,
 *              and starts listening on the configured port.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./src/config/swagger");
const router = require("./src/routes");
const errorHandler = require("./src/middlewares/errorHandler");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==============================
// GLOBAL MIDDLEWARES
// ==============================

// Enable CORS — allow requests from the configured frontend origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// HTTP request logger (uses 'dev' format in development for colored output)
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ==============================
// API DOCUMENTATION (Swagger UI)
// ==============================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==============================
// HEALTH CHECK ENDPOINT
// ==============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BCMS API Server is running",
    version: "1.0.0",
    docs: `${req.protocol}://${req.get("host")}/api-docs`,
  });
});

// ==============================
// API ROUTES (all prefixed with /api/v1)
// ==============================
app.use("/api/v1", router);

// ==============================
// GLOBAL ERROR HANDLER (must be last)
// ==============================
app.use(errorHandler);

// ==============================
// SOCKET.IO SETUP
// ==============================
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Attach io to app so controllers can access it
app.set("io", io);

// ==============================
// START SERVER
// ==============================
server.listen(PORT, () => {
  console.log(`\n🚀 BCMS API Server started`);
  console.log(`   - Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   - Port        : ${PORT}`);
  console.log(`   - API Base    : http://localhost:${PORT}/api/v1`);
  console.log(`   - API Docs    : http://localhost:${PORT}/api-docs\n`);
});

module.exports = { app, server, io };
