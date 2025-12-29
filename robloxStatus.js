import axios from "axios";
import { load } from "cheerio";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(tz);

const STATUS_URL = "https://status.roblox.com/";

// น้ำหนักใหม่ (สมจริงกว่า)
const STATUS_WEIGHT = {
  Operational: 100,
  "Degraded Performance": 90,
  Degraded: 90,
  "Partial Outage": 60,
  "Major Outage": 20
};

export async function fetchRobloxStatus(timezone = "Asia/Bangkok") {
  const { data: html } = await axios.get(STATUS_URL, {
    headers: { "User-Agent": "Roblox-Status-API" }
  });

  const $ = load(html);

  /* -------------------------
     1) คำนวณ HEALTH จาก component
  --------------------------*/
  let totalScore = 0;
  let totalServices = 0;

  $(".component").each((_, el) => {
    const status = $(el).find(".status").text().trim();
    const score = STATUS_WEIGHT[status];

    if (score !== undefined) {
      totalScore += score;
      totalServices++;
    }
  });

  let rawPercent = totalServices
    ? Math.round(totalScore / totalServices)
    : 100;

  // clamp ไม่ให้ดูเวอร์เกินจริง
  const healthPercent = Math.max(80, rawPercent);

  /* -------------------------
     2) ตรวจ INCIDENT จริง (banner)
  --------------------------*/
  const pageStatusText = $(".page-status").text().toLowerCase();
  const hasIncident =
    $(".unresolved-incidents").length > 0 ||
    pageStatusText.includes("outage") ||
    pageStatusText.includes("disruption");

  /* -------------------------
     3) map status หลัก
  --------------------------*/
  let statusText = "All Systems Operational";
  let state = "operational";
  let emoji = "🟢";

  if (hasIncident) {
    statusText = "Service Disruption";
    state = "partial";
    emoji = "🟠";
  }

  /* -------------------------
     4) เวลา
  --------------------------*/
  const nowUtc = dayjs.utc();
  const local = nowUtc.tz(timezone);

  return {
    status: {
      text: statusText,
      emoji,
      state
    },
    health: {
      emoji,
      percent: healthPercent
    },
    incidents: {
      active: hasIncident,
      count: hasIncident ? 1 : 0,
      message: hasIncident
        ? "Active incidents detected."
        : "No active incidents detected."
    },
    updated: {
      time: local.format("HH:mm"),
      timezone: timezone === "Asia/Bangkok" ? "TH" : timezone,
      full: local.format("YYYY-MM-DD HH:mm:ss"),
      iso: nowUtc.toISOString()
    }
  };
}
