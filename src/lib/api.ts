const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const api = {
  radar: `${base}/api/radar`,
  stream: `${base}/api/stream`
};
