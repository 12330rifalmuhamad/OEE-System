const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getDmsActions,
  createDmsAction,
  updateDmsAction,
  deleteDmsAction,
} = require("../controllers/dmsController");

const router = express.Router();

// Apply authMiddleware globally
router.use(authMiddleware);

router.get("/", getDmsActions);
router.post("/", createDmsAction);
router.put("/:id", updateDmsAction);
router.delete("/:id", deleteDmsAction);

module.exports = router;
