const express = require("express");
const { authMiddleware, optionalAuth } = require("../middlewares/authMiddleware");
const { sseHandler } = require("../lib/realtime");
const {
  getOkpLogs,
  createOkpLog,
  getOkpLogDetail,
  adjustActivityLog,
  updateOkpLog,
  initiateOkpLog,
  getActiveStoppage,
} = require("../controllers/transactionController");

const router = express.Router();

// Real-time Event Stream (SSE)
router.get("/realtime/stream", sseHandler);
router.get("/realtime/active-stoppage", optionalAuth, getActiveStoppage);

// OKP Logs
router.get("/okp", optionalAuth, getOkpLogs);
router.post("/okp", authMiddleware, createOkpLog);
router.post("/okp/initiate", optionalAuth, initiateOkpLog);
router.get("/okp/:id", optionalAuth, getOkpLogDetail);
router.put("/okp/:id", authMiddleware, updateOkpLog);

// Activity Logs Adjustment
router.put("/activity-logs/:id", authMiddleware, adjustActivityLog);

module.exports = router;

