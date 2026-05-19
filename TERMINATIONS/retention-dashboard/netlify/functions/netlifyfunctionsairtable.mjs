export async function handler(event) {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const key    = process.env.AIRTABLE_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID || 'appOq6qQpCuCU2Im9';
  const table  = process.env.AIRTABLE_TABLE   || 'TERMINATIONS_CUSTOMERS';

  if (!key) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'AIRTABLE_KEY not set in Netlify environment variables.' }),
    };
  }

  const params = event.queryStringParameters || {};
  const url    = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`);
  url.searchParams.set('pageSize', '100');
  if (params.offset) url.searchParams.set('offset', params.offset);

  try {
    const res  = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await res.json();
    return {
      statusCode: res.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: e.message }),
    };
  }
}
