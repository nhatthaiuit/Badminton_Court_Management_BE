/**
 * @file src/config/swagger.js
 * @description Swagger/OpenAPI 3.0 specification configuration.
 *              Automatically scans all route files for JSDoc @swagger annotations
 *              and generates an interactive API documentation page at /api-docs.
 */

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BCMS - Badminton Court Management System API",
      version: "1.0.0",
      description:
        "RESTful API for managing badminton courts, bookings, users, and payments. " +
        "Built with Node.js, Express, and MySQL.",
      contact: {
        name: "Nhat Thai",
        url: "https://github.com/nhatthaiuit/Badminton_Court_Management_BE",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "Current Server",
      },
    ],
    // Define reusable security scheme for JWT Bearer authentication
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from /auth/login",
        },
      },
      // Reusable response schemas
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
    // Apply JWT auth globally — individual endpoints can override
    security: [{ BearerAuth: [] }],
  },
  // Scan these files for @swagger JSDoc annotations
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
