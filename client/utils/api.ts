// In production, requests go to the deployed backend on Railway.
// In local dev, requests go directly to localhost:3001.
const API_BASE = process.env.NODE_ENV === 'production'
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://city-of-code-production.up.railway.app')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

export async function fetchRepoData(url: string) {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`${API_BASE}/api/repo?url=${encoded}`);
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Request failed with status ${response.status}`);
  }

  return json.data;
}
