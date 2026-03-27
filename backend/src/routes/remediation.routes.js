const router = require("express").Router();
const { getRemediations, getRemediation, createRemediation, updateRemediation } = require("../controllers/remediation.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect);
router.get("/", getRemediations);
router.get("/:id", getRemediation);
router.post("/", authorize("admin", "engineer"), createRemediation);
router.patch("/:id", authorize("admin", "engineer"), updateRemediation);

module.exports = router;
