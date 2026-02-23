import { NextRequest, NextResponse } from 'next/server';
import { validateAndParseGitHubUrl } from '../../../server/services/validator-next';
import { fetchRepositoryData, RepoData } from '../../../server/services/github-next';

// Simple in-memory cache (resets on cold start, but fine for Vercel)
const cache = new Map<string, { data: RepoData; expiresAt: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key: string): RepoData | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: RepoData): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    // Validate and parse
    const { owner, repo } = validateAndParseGitHubUrl(url);
    const cacheKey = `${owner}/${repo}`.toLowerCase();

    // Check cache
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`[cache] Hit for ${cacheKey}`);
      return NextResponse.json({ success: true, data: cached, cached: true });
    }

    // Fetch from GitHub
    const data = await fetchRepositoryData(owner, repo);

    // Store in cache
    setCache(cacheKey, data);

    return NextResponse.json({ success: true, data, cached: false });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string; code?: string };
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';

    console.error(`[error] ${statusCode} - ${message}`);

    return NextResponse.json(
      {
        success: false,
        error: { message, code },
      },
      { status: statusCode },
    );
  }
}
