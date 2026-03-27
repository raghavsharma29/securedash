const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const vulnerabilityRoutes = require("./routes/vulnerability.routes");
const scanRoutes = require("./routes/scan.routes");
const pipelineRoutes = require("./routes/pipeline.routes");
const remediationRoutes = require("./routes/remediation.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// Logging & parsing
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/seed", async (req, res) => {
  try {
    require("../scripts/seed.js");
    res.json({ message: "Seeding started..." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/vulnerabilities", vulnerabilityRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/pipelines", pipelineRoutes);
app.use("/api/remediation", remediationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use(errorHandler);

module.exports = app;
