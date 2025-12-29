export function getHealthInfo(percent) {
  if (percent === 100) {
    return {
      emoji: "🟢",
      state: "operational",
      text: "All Systems Operational"
    };
  }

  if (percent >= 80) {
    return {
      emoji: "🟡",
      state: "degraded",
      text: "Minor Service Issues"
    };
  }

  if (percent >= 40) {
    return {
      emoji: "🟠",
      state: "partial",
      text: "Partial Service Outage"
    };
  }

  return {
    emoji: "🔴",
    state: "outage",
    text: "Major Service Outage"
  };
}
