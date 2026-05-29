const express = require("express");
const { authMiddleware, optionalAuth } = require("../middlewares/authMiddleware");
const {
  getOkpLogs,
  createOkpLog,
  getOkpLogDetail,
  adjustActivityLog,
} = require("../controllers/transactionController");

const router = express.Router();

// OKP Logs
router.get("/okp", optionalAuth, getOkpLogs);
router.post("/okp", authMiddleware, createOkpLog);
router.get("/okp/:id", optionalAuth, getOkpLogDetail);

// Activity Logs Adjustment
router.put("/activity-logs/:id", authMiddleware, adjustActivityLog);

module.exports = router;

