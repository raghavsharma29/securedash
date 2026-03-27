const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    scanType: { type: String, enum: ["SAST", "DAST", "dependency", "container", "secret"], required: true },
    scanner: { type: String, required: true },
    repository: { type: String, required: true },
    branch: { type: String, default: "main" },
    commitHash: { type: String, default: "" },
    status: { type: String, enum: ["running", "completed", "failed"], default: "completed" },
    duration: { type: Number, default: 0 }, // seconds
    findings: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      info: { type: Number, default: 0 },
    },
    totalFindings: { type: Number, default: 0 },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: "Pipeline", default: null },
  },
  { timestamps: true }
);

scanSchema.index({ repository: 1, createdAt: -1 });

module.exports = mongoose.model("Scan", scanSchema);
