const startTime = Date.now();

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return res.status(200).json({
    status: 'healthy',
    uptime,
    timestamp: new Date().toISOString(),
    platform: 'vercel',
    region: process.env.VERCEL_REGION || 'unknown',
    version: '2.0.0'
  });
}
