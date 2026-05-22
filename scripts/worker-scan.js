const base = process.env.API_BASE_URL || 'http://localhost:4000';

console.log('Running real adapter scan via /api/radar ...');
const res = await fetch(`${base}/api/radar`);
const payload = await res.json();
console.log('generatedAt:', payload.generatedAt);
console.log('signals:', payload.signals?.length ?? 0);
console.log('failed sources:', payload.systemStatus?.failedSourceCount ?? 'unknown');
