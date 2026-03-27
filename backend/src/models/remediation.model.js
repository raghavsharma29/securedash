const mongoose = require("mongoose");

const remediationSchema = new mongoose.Schema(
  {
    vulnerability: { type: mongoose.Schema.Types.ObjectId, ref: "Vulnerability", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["open", "in_progress", "review", "done", "wont_fix"], default: "open" },
    priority: { type: String, enum: ["urgent", "high", "medium", "low"], default: "medium" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    notes: [
      {
        text: { type: String },
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    fixSuggestion: { type: String, default: "" },
  },
  { timestamps: true }
);

remediationSchema.index({ status: 1 });
remediationSchema.index({ assignedTo: 1 });

module.exports = mongoose.model("Remediation", remediationSchema);
