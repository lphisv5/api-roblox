import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const STATUS_JSON =
  "https://4277980205320394.hostedstatus.com/1.0/status/59db90dbcdeb2f04dadcf16d";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  try {
    const tz = req.query.tz || "Asia/Bangkok";

    const { data } = await axios.get(STATUS_JSON, {
      timeout: 8000,
      headers: {
        "User-Agent": "RobloxStatusAPI/2.0",
      },
    });

    const result = data.result;

    /* ===== Overall Status ===== */
    const overall = result.status_overall;
    const healthPercent = overall.status_code;

    let state = "operational";
    let emoji = "🟢";
    let text = "All Systems Operational";

    if (healthPercent < 80) {
      state = "partial";
      emoji = "🟠";
      text = "Service Disruption";
    } else if (healthPercent < 95) {
      state = "degraded";
      emoji = "🟡";
      text = "Minor Issues";
    }

    /* ===== Components ===== */
    const components = [];

    for (const group of result.status) {
      for (const c of group.containers) {
        components.push({
          category: group.name,
          name: c.name,
          status: c.status,
          weight: c.status_code,
          updated: c.updated,
        });
      }
    }

    /* ===== Incidents ===== */
    const hasIncidents = result.incidents.length > 0;

    const nowUtc = dayjs.utc();
    const local = nowUtc.tz(tz);

    return res.status(200).json({
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
      },
      components,
      incidents: {
        active: hasIncidents,
        count: result.incidents.length,
        message: hasIncidents
          ? `${result.incidents.length} active incident(s)`
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
      },
    });
  } catch (err) {
    return res.status(502).json({
      error: "BAD_GATEWAY",
      message: "Failed to fetch Roblox status",
      details: err.message,
    });
  }
}
