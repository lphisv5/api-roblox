import express from "express";
import { fetchRobloxStatus } from "./robloxStatus.js";
import { getHealthInfo } from "./utils.js";

const app = express();
const PORT = 3000;

// cache
let cache = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 1 นาที

app.get("/api/roblox/status", async (req, res) => {
  try {
    const timezone = req.query.tz || "Asia/Bangkok";
    const now = Date.now();

    if (cache && now - lastFetch < CACHE_TTL) {
      return res.json({ cached: true, ...cache });
    }

    const data = await fetchRobloxStatus(timezone);
    const health = getHealthInfo(data.healthPercent);

    const response = {
      title: "Roblox System Status",
      icon: "📡",
      status: {
        text: health.text,
        emoji: health.emoji,
        state: health.state
      },
      health: {
        emoji: health.emoji,
        percent: data.healthPercent
      },
      updated: {
        time: data.updateTime.time,
        timezone: data.updateTime.tz,
        full: data.updateTime.local,
        iso: data.updateTime.utc
      },
      incidents: {
        active: data.degradedCount > 0,
        count: data.degradedCount,
        message:
          data.degradedCount === 0
            ? "No active incidents detected."
            : "Active incidents detected."
      },
      meta: {
        official: true,
        source: "https://status.roblox.com"
      }
    };

    cache = response;
    lastFetch = now;

    res.json({ cached: false, ...response });
  } catch (err) {
    res.status(500).json({
      error: "ROBLOX_STATUS_FETCH_FAILED",
      message: err.message
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Roblox Status API running on http://localhost:${PORT}`)
);
