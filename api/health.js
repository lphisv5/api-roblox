import axios from "axios";

const STATUS_JSON = "https://4277980205320394.hostedstatus.com/1.0/status/59db90dbcdeb2f04dadcf16d";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const checks = {
    timestamp: new Date().toISOString(),
    platform: "vercel",
    version: "2.1.0",
    environment: process.env.VERCEL_ENV || "development",
    region: process.env.VERCEL: process.env.VERCEL_REGION || "unknown",
    checks: {}
  };

  // Check Roblox API connectivity
  try {
    const start = Date.now();
    await axios.head(STATUS_JSON, { timeout: 5000 });
    checks.checks.robloxApi = {
      status: "healthy",
      latency: Date.now() - start
    };
  } catch (error) {
    checks.checks.robloxApi = {
      status: "unhealthy",
      error: error.message
    };
  }

  const allHealthy = Object.values(checks.checks).every(c => c.status === "healthy");
  
  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    ...checks
  });
}
