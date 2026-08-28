require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const masterRoutes = require("./routes/masterRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const dmsRoutes = require("./routes/dmsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const seedRoutes = require("./routes/seedRoutes");
const { initMqttListeners } = require("./lib/mqttListener");
const { startOeeRealTimeTicker } = require("./lib/oeeHelper");
const { startTelemetryWatchdog } = require("./lib/telemetryWatchdog");

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration (allow frontend credentials to support cookie session transmission)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isLocal =
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://172.");
      if (isLocal) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());


// Root endpoint for simple health-check
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto;">
      <h1 style="color: #2ea44f;">KMI OEE Backend Express.js Server</h1>
      <p style="color: #586069;">Status: <strong>Active & Running</strong></p>
      <p style="color: #586069;">Environment: <strong>${process.env.NODE_ENV || "development"}</strong></p>
      <p style="color: #8c959f; font-size: 0.8rem; margin-top: 2rem;">© 2026 KMI OEE Enterprise. All telemetry listeners activated.</p>
    </div>
  `);
});

// Register API Routes (matching frontend endpoints)
app.use("/api/auth", authRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dms", dmsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/seed", seedRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan." });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ error: "Terjadi kesalahan internal server." });
});

// Launch Express Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 KMI OEE Backend Server started on port ${PORT}`);
  console.log(`👉 API Health Check at: http://localhost:${PORT}/`);
  console.log(`==================================================`);

  // Trigger MQTT background telemetry listeners on startup
  initMqttListeners().catch((err) => {
    console.error("[MQTT-BOOT] Failed to boot background telemetry listeners on startup:", err);
  });

  // Start periodic real-time OEE recalculation ticker
  startOeeRealTimeTicker().catch((err) => {
    console.error("[TICKER-BOOT] Failed to start OEE real-time ticker on startup:", err);
  });

  // Start real-time Telemetry Watchdog Timer
  startTelemetryWatchdog();
});
