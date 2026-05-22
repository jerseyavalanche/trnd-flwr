const base = process.env.API_BASE_URL || 'http://localhost:4000';

async function check(path) {
  const res = await fetch(`${base}${path}`);
  const body = await res.json();
  console.log(path, res.status, JSON.stringify(body).slice(0, 200));
}

await check('/api/health');
await check('/api/status');
await check('/api/sources/status');
