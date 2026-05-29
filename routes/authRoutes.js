const express = require("express");
const { login, register, me, logout } = require("../controllers/authController");
const { optionalAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", optionalAuth, me);
router.post("/logout", logout);

module.exports = router;

