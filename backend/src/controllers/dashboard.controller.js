const Vulnerability = require("../models/vulnerability.model");
const Scan = require("../models/scan.model");
const Pipeline = require("../models/pipeline.model");
const Remediation = require("../models/remediation.model");

// GET /api/dashboard/summary
const getSummary = async (req, res, next) => {
  try {
    const [vulnStats, scanCount, pipelineStats, remediationStats, severityBreakdown, recentVulns, trendData] =
      await Promise.all([
        // Vuln counts by status
        Vulnerability.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

        // Total scans this month
        Scan.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } }),

        // Pipeline gate stats
        Pipeline.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        // Remediation by status
        Remediation.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

        // Severity breakdown (open vulns)
        Vulnerability.aggregate([
          { $match: { status: { $in: ["open", "in_progress"] } } },
          { $group: { _id: "$severity", count: { $sum: 1 } } },
        ]),

        // Recent critical/high vulns
        Vulnerability.find({ severity: { $in: ["critical", "high"] }, status: "open" })
          .sort({ createdAt: -1 })
          .limit(5)
          .select("title severity scanType repository createdAt"),

        // 14-day scan trend
        Scan.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
              critical: { $sum: "$findings.critical" },
              high: { $sum: "$findings.high" },
              medium: { $sum: "$findings.medium" },
              low: { $sum: "$findings.low" },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    // Build posture score (0-100): penalize open critical/high
    const openCritical = severityBreakdown.find((s) => s._id === "critical")?.count || 0;
    const openHigh = severityBreakdown.find((s) => s._id === "high")?.count || 0;
    const openMedium = severityBreakdown.find((s) => s._id === "medium")?.count || 0;
    const postureScore = Math.max(0, 100 - openCritical * 10 - openHigh * 3 - openMedium * 0.5);

    const vulnMap = {};
    vulnStats.forEach((v) => { vulnMap[v._id] = v.count; });

    const pipelineMap = {};
    pipelineStats.forEach((p) => { pipelineMap[p._id] = p.count; });

    const remediationMap = {};
    remediationStats.forEach((r) => { remediationMap[r._id] = r.count; });

    res.json({
      postureScore: Math.round(postureScore),
      vulnerabilities: {
        open: vulnMap.open || 0,
        in_progress: vulnMap.in_progress || 0,
        resolved: vulnMap.resolved || 0,
        false_positive: vulnMap.false_positive || 0,
        total: Object.values(vulnMap).reduce((a, b) => a + b, 0),
      },
      scansThisMonth: scanCount,
      pipelines: {
        passed: pipelineMap.passed || 0,
        failed: pipelineMap.failed || 0,
        blocked: pipelineMap.blocked || 0,
        running: pipelineMap.running || 0,
      },
      remediation: {
        open: remediationMap.open || 0,
        in_progress: remediationMap.in_progress || 0,
        done: remediationMap.done || 0,
      },
      severityBreakdown: severityBreakdown.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {}),
      recentCritical: recentVulns,
      trendData,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary };
