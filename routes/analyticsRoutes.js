const express = require("express");
const { optionalAuth } = require("../middlewares/authMiddleware");
const { getOeeAnalytics } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/oee", optionalAuth, getOeeAnalytics);

module.exports = router;

