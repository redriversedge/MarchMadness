// save-state.js -- Admin-only: saves shared state to Netlify Blobs
const { getStore } = require('@netlify/blobs');

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const adminPin = body.pin;

    // Check admin PIN (set as ADMIN_PIN env var in Netlify)
    const expectedPin = process.env.ADMIN_PIN || '2026';
    if (adminPin !== expectedPin) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Invalid admin PIN' }) };
    }

    const store = getStore('march-madness');

    // Save draft assignments
    if (body.draft) {
      await store.setJSON('draft', body.draft);
    }

    // Save game results
    if (body.games) {
      await store.setJSON('games', body.games);
    }

    // Save timestamp
    await store.setJSON('meta', {
      lastPublished: new Date().toISOString(),
      publishedBy: 'admin'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, timestamp: new Date().toISOString() })
    };

  } catch (error) {
    console.error('Save state error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
