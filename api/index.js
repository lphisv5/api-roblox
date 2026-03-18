export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  
  const baseUrl = `https://${req.headers.host}`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roblox Status API v2.1</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .wrapper {
            background: #f5f5f5;
            border-radius: 20px;
            min-height: calc(100vh - 40px);
            padding: 20px;
        }
        header {
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        h1 { 
            font-size: 2.5em; 
            margin-bottom: 10px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { font-size: 1.2em; color: #666; }
        .container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
            margin-bottom: 20px;
        }
        h2 {
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 15px 0;
            border-left: 4px solid #667eea;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .endpoint:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .method {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 6px 16px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 0.9em;
            margin-right: 10px;
        }
        code {
            background: #f4f4f4;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            color: #e83e8c;
        }
        pre {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 10px;
            overflow-x: auto;
            margin: 15px 0;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            line-height: 1.5;
        }
        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.85em;
            margin: 0 5px;
            font-weight: 600;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .feature {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
            transition: transform 0.2s;
        }
        .feature:hover {
            transform: translateY(-3px);
        }
        .feature h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.2em;
        }
        .try-it {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            margin-top: 10px;
            transition: background 0.2s;
        }
        .try-it:hover {
            background: #764ba2;
        }
        .live-status {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            margin-top: 15px;
            display: none;
        }
        .live-status.active {
            display: block;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .status-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin: 5px 0;
        }
        .status-operational { background: #d4edda; color: #155724; }
        .status-degraded { background: #fff3cd; color: #856404; }
        .status-partial { background: #ffeeba; color: #856404; }
        .status-major { background: #f8d7da; color: #721c24; }
        
        footer {
            text-align: center;
            padding: 30px;
            color: #666;
            margin-top: 30px;
        }
        a { color: #667eea; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
        
        .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) {
            .grid-2 { grid-template-columns: 1fr; }
            h1 { font-size: 1.8em; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <header>
            <h1>📡 Roblox Status API</h1>
            <p class="subtitle">Production-ready monitoring API for Roblox system status</p>
            <div style="margin-top: 15px;">
                <span class="badge">v2.1.0</span>
                <span class="badge">⚡ Cached</span>
                <span class="badge">🌍 Multi-TZ</span>
            </div>
        </header>

        <div class="grid-2">
            <div class="container">
                <h2>✨ What's New in v2.1</h2>
                <div class="features">
                    <div class="feature">
                        <h3>⚡ Smart Caching</h3>
                        <p>15-second cache with stale fallback for 99.9% uptime</p>
                    </div>
                    <div class="feature">
                        <h3>🔄 Auto Retry</h3>
                        <p>Automatic retry with exponential backoff</p>
                    </div>
                    <div class="feature">
                        <h3>📊 Better Metrics</h3>
                        <p>Component counts and detailed incident info</p>
                    </div>
                    <div class="feature">
                        <h3>🎯 Health Checks</h3>
                        <p>Deep health monitoring with latency metrics</p>
                    </div>
                </div>
            </div>

            <div class="container">
                <h2>🔴 Live Status</h2>
                <div id="liveStatus">
                    <button class="try-it" onclick="fetchStatus()">🚀 Check Live Status</button>
                </div>
                <div id="statusResult" class="live-status">
                    <div id="statusContent"></div>
                </div>
            </div>
        </div>

        <div class="container">
            <h2>🚀 API Endpoints</h2>
            
            <div class="endpoint">
                <span class="method">GET</span>
                <code>/api/status</code>
                <span class="badge" style="background: #28a745;">JSON</span>
                <p style="margin-top: 10px;">Get current Roblox system status with full details</p>
                <p style="margin-top: 5px; color: #666;">
                    <strong>Query Parameters:</strong><br>
                    • <code>tz</code> - Timezone (default: Asia/Bangkok)<br>
                    • <code>refresh</code> - Force cache refresh (true/false)
                </p>
            </div>

            <div class="endpoint">
                <span class="method">GET</span>
                <code>/api/health</code>
                <span class="badge" style="background: #17a2b8;">Health</span>
                <p style="margin-top: 10px;">API health check with connectivity tests</p>
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
    "state": "operational",
    "operationalCount": 12,
    "totalCount": 12
  },
  "components": [...],
  "incidents": {
    "active": false,
    "count": 0,
    "total": 0,
    "items": [],
    "message": "No active incidents detected"
  },
  "updated": {
    "time": "14:30",
    "timezone": "TH",
    "full": "2026-03-18 14:30:00",
    "iso": "2026-03-18T07:30:00.000Z",
    "unix": 1742284200
  },
  "meta": {
    "official": true,
    "source": "status.roblox.com (Status.io)",
    "scrapeDuration": 234,
    "cacheTtl": 15000,
    "version": "2.1.0"
  }
}</pre>
        </div>

        <div class="container">
            <h2>💡 Usage Examples</h2>
            <pre>// JavaScript
const res = await fetch('${baseUrl}/api/status?tz=Asia/Bangkok');
const data = await res.json();

// cURL
curl ${baseUrl}/api/status?tz=America/New_York

// Force refresh
curl ${baseUrl}/api/status?refresh=true</pre>
        </div>

        <footer>
            <p>Built with ❤️ for the Roblox community</p>
            <p style="margin-top: 10px; font-size: 0.9em;">
                Data sourced from <a href="https://status.roblox.com" target="_blank">status.roblox.com</a> • 
                <a href="${baseUrl}/api/status">Try it now</a>
            </p>
        </footer>
    </div>

    <script>
        async function fetchStatus() {
            const btn = document.querySelector('.try-it');
            const result = document.getElementById('statusResult');
            const content = document.getElementById('statusContent');
            
            btn.textContent = '⏳ Loading...';
            btn.disabled = true;
            
            try {
                const res = await fetch('/api/status');
                const data = await res.json();
                
                const statusClass = data.status.state === 'operational' ? 'status-operational' :
                                  data.status.state === 'degraded' ? 'status-degraded' :
                                  data.status.state === 'partial' ? 'status-partial' : 'status-major';
                
                content.innerHTML = \`
                    <div class="status-indicator \${statusClass}">
                        <span style="font-size: 1.2em;">\${data.status.emoji}</span>
                        <span>\${data.status.text}</span>
                    </div>
                    <div style="margin-top: 15px;">
                        <strong>Health:</strong> \${data.health.percent}%<br>
                        <strong>Components:</strong> \${data.health.operationalCount}/\${data.health.totalCount} operational<br>
                        <strong>Incidents:</strong> \${data.incidents.message}<br>
                        <strong>Updated:</strong> \${data.updated.time} (\${data.updated.timezone})<br>
                        <strong>Cached:</strong> \${data.cached ? 'Yes' : 'No'}
                    </div>
                \`;
                
                result.classList.add('active');
            } catch (error) {
                content.innerHTML = \`<div class="status-indicator status-major">❌ Error: \${error.message}</div>\`;
                result.classList.add('active');
            } finally {
                btn.textContent = '🔄 Refresh';
                btn.disabled = false;
            }
        }
        
        // Auto-fetch on load
        fetchStatus();
    </script>
</body>
</html>
  `;

  return res.status(200).send(html);
}
