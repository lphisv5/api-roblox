import axios from "axios";
import cheerio from "cheerio";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

const STATUS_URL = "https://status.roblox.com/";
const STATUS_WEIGHT = {
  Operational: 100,
  Degraded: 70,
  "Partial Outage": 40,
  "Major Outage": 0
};

export async function fetchRobloxStatus(timezone = "Asia/Bangkok") {
  const { data: html } = await axios.get(STATUS_URL, {
    headers: { "User-Agent": "Roblox-Status-API" }
  });

  const $ = cheerio.load(html);

  let totalScore = 0;
  let totalServices = 0;
  let degradedCount = 0;

  $(".component").each((_, el) => {
    const status = $(el).find(".status").text().trim();
    const score = STATUS_WEIGHT[status] ?? 50;

    totalScore += score;
    totalServices++;

    if (score < 100) degradedCount++;
  });

  const healthPercent = totalServices
    ? Math.round(totalScore / totalServices)
    : 100;

  return {
    healthPercent,
    degradedCount,
    updateTime: {
      utc: dayjs.utc().toISOString(),
      local: dayjs.utc().tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
      time: dayjs.utc().tz(timezone).format("HH:mm"),
      tz: timezone === "Asia/Bangkok" ? "TH" : timezone
    }
  };
}
