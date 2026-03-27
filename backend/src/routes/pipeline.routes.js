const router = require("express").Router();
const { getPipelines, getPipeline, createPipeline, updatePipeline, getGateSummary } = require("../controllers/pipeline.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect);
router.get("/", getPipelines);
router.get("/stats/gate-summary", getGateSummary);
router.get("/:id", getPipeline);
router.post("/", authorize("admin", "engineer"), createPipeline);
router.patch("/:id", authorize("admin", "engineer"), updatePipeline);

module.exports = router;
