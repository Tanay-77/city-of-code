const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchRepoData(url: string) {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`${API_BASE}/api/repo?url=${encoded}`);
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Request failed with status ${response.status}`);
  }

  return json.data;
}
