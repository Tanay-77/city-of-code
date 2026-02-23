// With Vercel, the API route runs on the same domain — no separate server needed.
// In local dev, Next.js serves the API route at /api/repo automatically.
export async function fetchRepoData(url: string) {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`/api/repo?url=${encoded}`);
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Request failed with status ${response.status}`);
  }

  return json.data;
}
