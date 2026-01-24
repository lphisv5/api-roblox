export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roblox Status API v2.0</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        h1 { font-size: 2.5em; margin-bottom: 10px; }
        .subtitle { font-size: 1.2em; opacity: 0.9; }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h2 {
            color: #667eea;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
        }
        .method {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.9em;
            margin-right: 10px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', monospace;
            font-size: 0.9em;
        }
        pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 20px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.85em;
            margin-left: 10px;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 3px solid #667eea;
        }
        .feature h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        footer {
            text-align: center;
            padding: 20px;
            color: #666;
            margin-top: 30px;
        }
        a { color: #667eea; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <header>
        <h1>📡 Roblox Status API</h1>
        <p class="subtitle">Production-ready monitoring API for Roblox system status</p>
        <span class="badge">v2.0.0</span>
        <span class="badge">Vercel</span>
    </header>

    <div class="container">
        <h2>✨ Features</h2>
        <div class="features">
            <div class="feature">
                <h3>🔒 Production Ready</h3>
                <p>Error handling, logging, and monitoring built-in</p>
            </div>
            <div class="feature">
                <h3>⚡ High Performance</h3>
                <p>Smart caching and retry mechanism</p>
            </div>
            <div class="feature">
                <h3>🌍 Multi-Timezone</h3>
                <p>Support for multiple timezones</p>
            </div>
            <div class="feature">
                <h3>📊 Detailed Metrics</h3>
                <p>Health percentage and component status</p>
            </div>
        </div>
    </div>

    <div class="container">
        <h2>🚀 API Endpoints</h2>
        
        <div class="endpoint">
            <span class="method">GET</span>
            <code>/api/status</code>
            <p style="margin-top: 10px;">Get current Roblox system status</p>
            <p style="margin-top: 5px; color: #666;">
                <strong>Query Parameters:</strong><br>
                • <code>tz</code> - Timezone (default: Asia/Bangkok)<br>
                • <code>refresh</code> - Force cache refresh (true/false)
            </p>
        </div>

        <div class="endpoint">
            <span class="method">GET</span>
            <code>/api/health</code>
            <p style="margin-top: 10px;">API health check</p>
        </div>
    </div>

    <div class="container">
        <h2>📖 Example Response</h2>
        <pre>{
  "cached": false,
  "title": "Roblox System Status",
  "icon": "📡",
  "status": {
    "text": "All Systems Operational",
    "emoji": "🟢",
    "state": "operational"
  },
  "health": {
    "percent": 100,
    "emoji": "🟢",
    "state": "operational"
  },
  "components": [
    {
      "name": "Website",
      "status": "Operational",
      "weight": 100
    }
  ],
  "incidents": {
    "active": false,
    "count": 0,
    "message": "No active incidents detected"
  },
  "updated": {
    "time": "14:30",
    "timezone": "TH",
    "full": "2026-01-24 14:30:00",
    "iso": "2026-01-24T07:30:00.000Z",
    "unix": 1737705000
  },
  "meta": {
    "official": true,
    "source": "https://status.roblox.com",
    "scrapeDuration": 234
  }
}</pre>
    </div>

    <div class="container">
        <h2>🌐 Supported Timezones</h2>
        <p>Asia/Bangkok, America/New_York, America/Los_Angeles, Europe/London, Asia/Tokyo, Australia/Sydney, UTC</p>
    </div>

    <div class="container">
        <h2>💡 Usage Examples</h2>
        <pre>// JavaScript Fetch
fetch('/api/status?tz=Asia/Bangkok')
  .then(res => res.json())
  .then(data => console.log(data));

// cURL
curl https://your-api.vercel.app/api/status

// With timezone
curl https://your-api.vercel.app/api/status?tz=America/New_York</pre>
    </div>

    <footer>
        <p>Built with ❤️ for the Roblox community</p>
        <p style="margin-top: 10px; font-size: 0.9em;">
            Data sourced from <a href="https://status.roblox.com" target="_blank">status.roblox.com</a>
        </p>
    </footer>
</body>
</html>
  `;

  return res.status(200).send(html);
}
