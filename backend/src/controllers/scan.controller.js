const Scan = require("../models/scan.model");
const { getIO } = require("../config/socket");

// GET /api/scans
const getScans = async (req, res, next) => {
  try {
    const { repository, scanType, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (repository) filter.repository = repository;
    if (scanType) filter.scanType = scanType;
    if (status) filter.status = status;

    const total = await Scan.countDocuments(filter);
    const scans = await Scan.find(filter)
      .populate("triggeredBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ scans, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/scans/:id
const getScan = async (req, res, next) => {
  try {
    const scan = await Scan.findById(req.params.id).populate("triggeredBy", "name email");
    if (!scan) return res.status(404).json({ error: "Scan not found" });
    res.json({ scan });
  } catch (err) {
    next(err);
  }
};

// POST /api/scans
const createScan = async (req, res, next) => {
  try {
    const scan = await Scan.create({ ...req.body, triggeredBy: req.user._id });

    try { getIO().emit("scans:new", { scan }); } catch (_) {}

    res.status(201).json({ scan });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/scans/:id
const updateScan = async (req, res, next) => {
  try {
    const scan = await Scan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!scan) return res.status(404).json({ error: "Scan not found" });
    res.json({ scan });
  } catch (err) {
    next(err);
  }
};

// GET /api/scans/stats/trend
const getScanTrend = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trend = await Scan.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          scans: { $sum: 1 },
          totalFindings: { $sum: "$totalFindings" },
          critical: { $sum: "$findings.critical" },
          high: { $sum: "$findings.high" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ trend });
  } catch (err) {
    next(err);
  }
};

module.exports = { getScans, getScan, createScan, updateScan, getScanTrend };
