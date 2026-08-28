const express = require("express");
const { authMiddleware, optionalAuth } = require("../middlewares/authMiddleware");
const { sseHandler } = require("../lib/realtime");
const {
  getOkpLogs,
  createOkpLog,
  getOkpLogDetail,
  adjustActivityLog,
  splitActivityLog,
  updateOkpLog,
  toggleLockOkpLog,
  initiateOkpLog,
  finishOkpLog,
  getActiveStoppage,
  createManualActivityLog,
  resumeProduction,
  getMachineStates,
  changeLotOkpLog,
} = require("../controllers/transactionController");
const { parseAndImportOkpLogs, importPackagingLogs } = require("../controllers/importController");

const router = express.Router();

// Real-time Event Stream (SSE)
router.get("/realtime/stream", sseHandler);
router.get("/realtime/active-stoppage", optionalAuth, getActiveStoppage);
router.get("/realtime/machine-states", optionalAuth, getMachineStates);

// OKP Logs
router.get("/okp", optionalAuth, getOkpLogs);
router.post("/okp", authMiddleware, createOkpLog);
router.post("/okp/import", optionalAuth, parseAndImportOkpLogs);
router.post("/okp/import-packaging", optionalAuth, importPackagingLogs);
router.post("/okp/initiate", optionalAuth, initiateOkpLog);
router.post("/okp/change-lot", optionalAuth, changeLotOkpLog);
router.post("/okp/:id/finish", optionalAuth, finishOkpLog);
router.get("/okp/:id", optionalAuth, getOkpLogDetail);
router.put("/okp/:id", authMiddleware, updateOkpLog);
router.put("/okp/:id/lock", authMiddleware, toggleLockOkpLog);

// Activity Logs Adjustment
router.put("/activity-logs/:id", optionalAuth, adjustActivityLog);
router.put("/activity-logs/:id/split", optionalAuth, splitActivityLog);
router.post("/activity-logs/manual", authMiddleware, createManualActivityLog);
router.post("/activity-logs/resume", optionalAuth, resumeProduction);

module.exports = router;

