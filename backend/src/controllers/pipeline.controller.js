const Pipeline = require("../models/pipeline.model");
const { getIO } = require("../config/socket");

// GET /api/pipelines
const getPipelines = async (req, res, next) => {
  try {
    const { repository, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (repository) filter.repository = repository;
    if (status) filter.status = status;

    const total = await Pipeline.countDocuments(filter);
    const pipelines = await Pipeline.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ pipelines, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/pipelines/:id
const getPipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findById(req.params.id);
    if (!pipeline) return res.status(404).json({ error: "Pipeline not found" });
    res.json({ pipeline });
  } catch (err) {
    next(err);
  }
};

// POST /api/pipelines
const createPipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.create(req.body);
    try { getIO().emit("pipelines:new", { pipeline }); } catch (_) {}
    res.status(201).json({ pipeline });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/pipelines/:id
const updatePipeline = async (req, res, next) => {
  try {
    const pipeline = await Pipeline.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!pipeline) return res.status(404).json({ error: "Pipeline not found" });
    try { getIO().emit("pipelines:updated", { pipeline }); } catch (_) {}
    res.json({ pipeline });
  } catch (err) {
    next(err);
  }
};

// GET /api/pipelines/stats/gate-summary
const getGateSummary = async (req, res, next) => {
  try {
    const summary = await Pipeline.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);
    res.json({ summary });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPipelines, getPipeline, createPipeline, updatePipeline, getGateSummary };
