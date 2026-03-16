// load-state.js -- Public: loads shared state from Netlify Blobs
const { getStore } = require('@netlify/blobs');

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
    const store = getStore('march-madness');

    const draft = await store.get('draft', { type: 'json' });
    const games = await store.get('games', { type: 'json' });
    const meta = await store.get('meta', { type: 'json' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        draft: draft || {},
        games: games || {},
        meta: meta || null
      })
    };

  } catch (error) {
    console.error('Load state error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ draft: {}, games: {}, meta: null })
    };
  }
};
