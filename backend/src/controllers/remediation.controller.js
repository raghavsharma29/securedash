const Remediation = require("../models/remediation.model");
const Vulnerability = require("../models/vulnerability.model");
const { getIO } = require("../config/socket");

// GET /api/remediation
const getRemediations = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    const total = await Remediation.countDocuments(filter);
    const tasks = await Remediation.find(filter)
      .populate("vulnerability", "title severity scanType repository")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ remediations: tasks, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/remediation/:id
const getRemediation = async (req, res, next) => {
  try {
    const task = await Remediation.findById(req.params.id)
      .populate("vulnerability")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("notes.author", "name email");
    if (!task) return res.status(404).json({ error: "Remediation task not found" });
    res.json({ remediation: task });
  } catch (err) {
    next(err);
  }
};

// POST /api/remediation
const createRemediation = async (req, res, next) => {
  try {
    const task = await Remediation.create({ ...req.body, createdBy: req.user._id });

    // Update vuln status to in_progress
    await Vulnerability.findByIdAndUpdate(req.body.vulnerability, { status: "in_progress" });

    try { getIO().emit("remediation:new", { task }); } catch (_) {}

    res.status(201).json({ remediation: task });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/remediation/:id
const updateRemediation = async (req, res, next) => {
  try {
    const { note, ...updates } = req.body;

    if (updates.status === "done") updates.completedAt = new Date();

    const task = await Remediation.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("vulnerability", "title severity")
      .populate("assignedTo", "name email");
    if (!task) return res.status(404).json({ error: "Remediation not found" });

    // Add note if provided
    if (note) {
      task.notes.push({ text: note, author: req.user._id });
      await task.save();
    }

    // Sync vuln status
    if (updates.status === "done") {
      await Vulnerability.findByIdAndUpdate(task.vulnerability, { status: "resolved", resolvedAt: new Date() });
    }

    try { getIO().emit("remediation:updated", { id: task._id, status: task.status }); } catch (_) {}

    res.json({ remediation: task });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRemediations, getRemediation, createRemediation, updateRemediation };
