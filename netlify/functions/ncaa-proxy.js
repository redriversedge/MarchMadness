// netlify/functions/ncaa-proxy.js
// Proxies requests to ESPN NCAA tournament scoreboard API
const https = require('https');

// Simple in-memory cache (60 second TTL)
let cache = {};
const CACHE_TTL = 60000;

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const date = params.date || formatToday();

    // Check cache
    const cacheKey = 'scores-' + date;
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].time) < CACHE_TTL) {
      return { statusCode: 200, headers, body: cache[cacheKey].data };
    }

    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&dates=${date}&limit=100`;

    const data = await makeRequest(url);

    // Cache response
    cache[cacheKey] = { data: data, time: Date.now() };

    return { statusCode: 200, headers, body: data };

  } catch (error) {
    console.error('NCAA proxy error:', error.message);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function formatToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          const err = new Error('ESPN returned ' + res.statusCode);
          err.statusCode = res.statusCode;
          reject(err);
        } else {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('ESPN request timed out'));
    });
    req.end();
  });
}
