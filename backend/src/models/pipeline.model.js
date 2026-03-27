const mongoose = require("mongoose");

const pipelineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    repository: { type: String, required: true },
    branch: { type: String, default: "main" },
    commitHash: { type: String, default: "" },
    commitMessage: { type: String, default: "" },
    author: { type: String, default: "" },
    status: { type: String, enum: ["passed", "failed", "running", "blocked"], default: "running" },
    securityGates: [
      {
        name: { type: String },
        type: { type: String, enum: ["SAST", "DAST", "dependency", "container", "secret"] },
        status: { type: String, enum: ["passed", "failed", "skipped", "running"] },
        findingCount: { type: Number, default: 0 },
        blockedOn: { type: String, default: "" },
      },
    ],
    duration: { type: Number, default: 0 },
    triggeredAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    ciProvider: { type: String, enum: ["github_actions", "jenkins", "gitlab_ci", "circleci", "manual"], default: "github_actions" },
  },
  { timestamps: true }
);

pipelineSchema.index({ repository: 1, createdAt: -1 });

module.exports = mongoose.model("Pipeline", pipelineSchema);
