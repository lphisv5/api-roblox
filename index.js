import express from "express";
import { fetchRobloxStatus } from "./robloxStatus.js";

const app = express();
const PORT = 3000;

// cache
let cache = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000; // 1 นาที

app.get("/api/roblox/status", async (req, res) => {
  try {
    const tz = req.query.tz || "Asia/Bangkok";
    const now = Date.now();

    if (cache && now - lastFetch < CACHE_TTL) {
      return res.json(cache);
    }

    const data = await fetchRobloxStatus(tz);

    // ❗ ไม่แกะ ไม่แตะ field ด้านใน
    const response = {
      cached: false,
      title: "Roblox System Status",
      icon: "📡",
      ...data,
      meta: {
        official: true,
        source: "https://status.roblox.com"
      }
    };

    cache = response;
    lastFetch = now;

    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: "ROBLOX_STATUS_FETCH_FAILED",
      message: err.message
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Roblox Status API running on :${PORT}`)
);
