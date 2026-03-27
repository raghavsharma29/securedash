const router = require("express").Router();
const { getScans, getScan, createScan, updateScan, getScanTrend } = require("../controllers/scan.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect);
router.get("/", getScans);
router.get("/stats/trend", getScanTrend);
router.get("/:id", getScan);
router.post("/", authorize("admin", "engineer"), createScan);
router.patch("/:id", authorize("admin", "engineer"), updateScan);

module.exports = router;
