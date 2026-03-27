require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/user.model");
const Vulnerability = require("../src/models/vulnerability.model");
const Scan = require("../src/models/scan.model");
const Pipeline = require("../src/models/pipeline.model");
const Remediation = require("../src/models/remediation.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/securedash";

const repos = ["api-gateway", "auth-service", "payment-service", "user-service", "frontend-app"];
const scanners = ["Semgrep", "Bandit", "OWASP ZAP", "Snyk", "Trivy", "Gitleaks"];
const severities = ["critical", "high", "medium", "low", "info"];
const scanTypes = ["SAST", "DAST", "dependency", "container", "secret"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Clear all
  await Promise.all([
    User.deleteMany({}),
    Vulnerability.deleteMany({}),
    Scan.deleteMany({}),
    Pipeline.deleteMany({}),
    Remediation.deleteMany({}),
  ]);
  console.log("🗑️  Cleared existing data");

  // Users
  const users = await User.create([
    { name: "Admin User", email: "admin@securedash.io", password: "Admin@123", role: "admin" },
    { name: "Alice Engineer", email: "engineer@securedash.io", password: "Eng@123", role: "engineer" },
    { name: "Bob Viewer", email: "viewer@securedash.io", password: "View@123", role: "viewer" },
    { name: "Carol Dev", email: "carol@securedash.io", password: "Carol@123", role: "engineer" },
  ]);
  console.log(`👤 Created ${users.length} users`);

  const admin = users[0];
  const engineer = users[1];

  // Vulnerabilities
  const vulnData = [];
  const vulnTitles = {
    SAST: ["SQL Injection in login handler", "XSS in user input", "Hardcoded secret key", "Command injection", "Path traversal vulnerability", "Insecure deserialization"],
    DAST: ["Reflected XSS on /search", "CSRF token missing", "Open redirect on callback", "Directory listing enabled", "HTTP security headers missing"],
    dependency: ["Lodash prototype pollution", "Log4j RCE (CVE-2021-44228)", "Axios SSRF vulnerability", "express vulnerable to ReDoS", "npm package typosquatting"],
    container: ["Base image has 47 CVEs", "Running as root user", "Exposed sensitive port 22", "Outdated Alpine 3.12"],
    secret: ["AWS Access Key exposed in .env", "GitHub token in config", "Database password in logs"],
  };

  for (let i = 0; i < 80; i++) {
    const type = rand(scanTypes);
    const sev = rand(["critical", "critical", "high", "high", "high", "medium", "medium", "medium", "low", "info"]);
    const statuses = ["open", "open", "open", "in_progress", "resolved", "false_positive"];
    vulnData.push({
      title: rand(vulnTitles[type]),
      description: `This vulnerability was discovered during a ${type} scan. Immediate review recommended.`,
      severity: sev,
      status: rand(statuses),
      scanType: type,
      scanner: rand(scanners),
      cveId: Math.random() > 0.6 ? `CVE-2023-${randInt(1000, 9999)}` : "",
      cvssScore: sev === "critical" ? randInt(90, 100) / 10 : sev === "high" ? randInt(70, 89) / 10 : randInt(40, 69) / 10,
      affectedFile: `src/${rand(["auth", "api", "utils", "models", "controllers"])}/${rand(["index", "handler", "service", "controller"])}.js`,
      affectedLine: randInt(10, 500),
      repository: rand(repos),
      branch: rand(["main", "dev", "feature/auth", "hotfix/security"]),
      createdAt: pastDate(randInt(0, 60)),
    });
  }
  const vulns = await Vulnerability.insertMany(vulnData);
  console.log(`🔍 Created ${vulns.length} vulnerabilities`);

  // Scans
  const scanData = [];
  for (let i = 0; i < 40; i++) {
    const critical = randInt(0, 5);
    const high = randInt(0, 10);
    const medium = randInt(2, 20);
    const low = randInt(5, 30);
    const info = randInt(0, 15);
    scanData.push({
      name: `${rand(scanTypes)} scan on ${rand(repos)}`,
      scanType: rand(scanTypes),
      scanner: rand(scanners),
      repository: rand(repos),
      branch: rand(["main", "dev", "feature/auth"]),
      commitHash: Math.random().toString(36).substring(2, 10),
      status: rand(["completed", "completed", "completed", "failed"]),
      duration: randInt(30, 600),
      findings: { critical, high, medium, low, info },
      totalFindings: critical + high + medium + low + info,
      triggeredBy: rand([admin._id, engineer._id]),
      createdAt: pastDate(randInt(0, 30)),
    });
  }
  const scans = await Scan.insertMany(scanData);
  console.log(`📋 Created ${scans.length} scans`);

  // Pipelines
  const pipelineData = [];
  const ciProviders = ["github_actions", "jenkins", "gitlab_ci"];
  for (let i = 0; i < 25; i++) {
    const gateStatuses = ["passed", "failed", "skipped"];
    pipelineData.push({
      name: `Build & Security Check #${100 + i}`,
      repository: rand(repos),
      branch: rand(["main", "dev", "feature/auth"]),
      commitHash: Math.random().toString(36).substring(2, 10),
      commitMessage: rand(["fix: auth bug", "feat: add user endpoint", "chore: deps update", "refactor: cleanup", "fix: security patch"]),
      author: rand(["alice", "bob", "carol", "dave"]),
      status: rand(["passed", "passed", "failed", "blocked", "running"]),
      securityGates: [
        { name: "SAST Gate", type: "SAST", status: rand(gateStatuses), findingCount: randInt(0, 10) },
        { name: "Dependency Gate", type: "dependency", status: rand(gateStatuses), findingCount: randInt(0, 5) },
        { name: "Secret Detection", type: "secret", status: rand(gateStatuses), findingCount: randInt(0, 3) },
        { name: "Container Scan", type: "container", status: rand(gateStatuses), findingCount: randInt(0, 8) },
      ],
      duration: randInt(60, 900),
      ciProvider: rand(ciProviders),
      triggeredAt: pastDate(randInt(0, 14)),
      createdAt: pastDate(randInt(0, 14)),
    });
  }
  const pipelines = await Pipeline.insertMany(pipelineData);
  console.log(`🔁 Created ${pipelines.length} pipelines`);

  // Remediations
  const openVulns = vulns.filter((v) => v.status === "open" || v.status === "in_progress").slice(0, 15);
  const remediationData = openVulns.map((v, i) => ({
    vulnerability: v._id,
    title: `Fix: ${v.title}`,
    description: `Remediation task for ${v.severity} severity vulnerability found in ${v.repository}.`,
    status: rand(["open", "in_progress", "review", "done"]),
    priority: v.severity === "critical" ? "urgent" : v.severity === "high" ? "high" : "medium",
    assignedTo: rand([engineer._id, admin._id, users[3]._id]),
    createdBy: admin._id,
    dueDate: new Date(Date.now() + randInt(3, 30) * 24 * 60 * 60 * 1000),
    fixSuggestion: `Update the affected component and apply input validation. See OWASP guidelines for ${v.scanType}.`,
    createdAt: pastDate(randInt(0, 20)),
  }));
  const remediations = await Remediation.insertMany(remediationData);
  console.log(`🛠️  Created ${remediations.length} remediation tasks`);

  console.log("\n✅ Seed complete!");
  console.log("─────────────────────────────");
  console.log("🔑 Login credentials:");
  console.log("   admin@securedash.io    / Admin@123");
  console.log("   engineer@securedash.io / Eng@123");
  console.log("   viewer@securedash.io   / View@123");
  console.log("─────────────────────────────");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
