import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const STATUS_JSON = "https://4277980205320394.hostedstatus.com/1.0/status/59db90dbcdeb2f04dadcf16d";

// In-memory cache
const cache = {
  data: null,
  timestamp: 0,
  ttl: 15000 // 15 seconds cache
};

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

async function fetchWithRetry(url, options, retries = 0) {
  try {
    return await axios.get(url, options);
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries + 1);
    }
    throw error;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "s-maxage=15, stale-while-revalidate");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const tz = req.query.tz || "Asia/Bangkok";
    const forceRefresh = req.query.refresh === "true";
    const now = Date.now();

    // Check cache
    if (!forceRefresh && cache.data && (now - cache.timestamp) < cache.ttl) {
      const cachedResponse = {
        ...cache.data,
        cached: true,
        cachedAt: new Date(cache.timestamp).toISOString()
      };
      return res.status(200).json(cachedResponse);
    }

    const startTime = Date.now();
    
    const { data } = await fetchWithRetry(STATUS_JSON, {
      timeout: 8000,
      headers: {
        "User-Agent": "RobloxStatusAPI/2.0",
        "Accept": "application/json",
      },
    });

    const scrapeDuration = Date.now() - startTime;
    const result = data.result;

    /* ===== Overall Status ===== */
    const overall = result.status_overall;
    const healthPercent = overall.status_code;

    let state = "operational";
    let emoji = "🟢";
    let text = "All Systems Operational";

    if (healthPercent < 70) {
      state = "major_outage";
      emoji = "🔴";
      text = "Major Service Outage";
    } else if (healthPercent < 90) {
      state = "partial";
      emoji = "🟠";
      text = "Service Disruption";
    } else if (healthPercent < 100) {
      state = "degraded";
      emoji = "🟡";
      text = "Minor Issues";
    }

    /* ===== Components ===== */
    const components = [];
    let operationalCount = 0;

    for (const group of result.status) {
      for (const c of group.containers) {
        const isOperational = c.status_code === 100;
        if (isOperational) operationalCount++;
        
        components.push({
          category: group.name,
          name: c.name,
          status: c.status,
          statusCode: c.status_code,
          state: getStatusState(c.status_code),
          emoji: getComponentEmoji(c.status_code),
          weight: c.status_code,
          updated: c.updated,
        });
      }
    }

    /* ===== Incidents ===== */
    const activeIncidents = result.incidents.filter(inc => 
      inc.status !== "resolved" && inc.status !== "completed"
    );
    const hasIncidents = activeIncidents.length > 0;

    const nowUtc = dayjs.utc();
    const local = nowUtc.tz(tz);

    const response = {
      cached: false,
      title: "Roblox System Status",
      icon: "📡",
      status: {
        text,
        emoji,
        state,
      },
      health: {
        percent: healthPercent,
        emoji,
        state,
        operationalCount,
        totalCount: components.length
      },
      components: components.sort((a, b) => b.weight - a.weight),
      incidents: {
        active: hasIncidents,
        count: activeIncidents.length,
        total: result.incidents.length,
        items: activeIncidents.map(inc => ({
          id: inc._id,
          name: inc.name,
          status: inc.status,
          impact: inc.impact,
          started: inc.started,
          updated: inc.updated,
          description: inc.description || null
        })),
        message: hasIncidents
          ? `${activeIncidents.length} active incident(s)`
          : "No active incidents detected",
      },
      updated: {
        time: local.format("HH:mm"),
        timezone: tz === "Asia/Bangkok" ? "TH" : tz,
        full: local.format("YYYY-MM-DD HH:mm:ss"),
        iso: nowUtc.toISOString(),
        unix: nowUtc.unix(),
      },
      meta: {
        official: true,
        source: "status.roblox.com (Status.io)",
        scrapeDuration,
        cacheTtl: cache.ttl,
        version: "2.1.0"
      },
    };

    // Update cache
    cache.data = response;
    cache.timestamp = now;

    return res.status(200).json(response);

  } catch (err) {
    console.error("Status fetch error:", err.message);
    
    // Return cached data if available (stale cache)
    if (cache.data) {
      return res.status(200).json({
        ...cache.data,
        cached: true,
        stale: true,
        error: "Using stale cache due to fetch failure"
      });
    }

    return res.status(502).json({
      error: "BAD_GATEWAY",
      message: "Failed to fetch Roblox status",
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}

function getStatusState(code) {
  if (code === 100) return "operational";
  if (code >= 90) return "degraded";
  if (code >= 70) return "partial_outage";
  return "major_outage";
}

function getComponentEmoji(code) {
  if (code === 100) return "🟢";
  if (code >= 90) return "🟡";
  if (code >= 70) return "🟠";
  return "🔴";
}
