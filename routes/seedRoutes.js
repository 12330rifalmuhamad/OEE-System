const express = require("express");
const { seedCategories } = require("../controllers/seedController");

const router = express.Router();

// No auth required for seeding (to match Next.js original behavior)
router.get("/", seedCategories);

module.exports = router;
