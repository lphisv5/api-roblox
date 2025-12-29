import express from "express";
import { fetchRobloxStatus } from "./robloxStatus.js";

const app = express();
const PORT = 3000;

let cache = null;
let lastFetch = 0;
const CACHE_TTL = 60 * 1000;

app.get("/api/roblox/status", async (req, res) => {
  try {
    const tz = req.query.tz || "Asia/Bangkok";
    const now = Date.now();

    if (cache && now - lastFetch < CACHE_TTL) {
      return res.json({ cached: true, ...cache });
    }

    const data = await fetchRobloxStatus(tz);

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
      error: "ROBLOX_STATUS_FAILED",
      message: err.message
    });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Roblox Status API running on :${PORT}`)
);
