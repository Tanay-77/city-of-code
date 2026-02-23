import { createError } from './errors';
import { getLanguageInfo, estimateLinesOfCode } from './languageMap';

// ----- Types -----
export interface RepoFile {
  path: string;
  name: string;
  size: number;
  lines: number;
  language: string;
  color: string;
  folder: string;
  commitCount: number;
  isFrequentlyUpdated: boolean;
}

export interface RepoData {
  owner: string;
  repo: string;
  totalFiles: number;
  totalLines: number;
  mainLanguage: string;
  largestFile: string;
  languageBreakdown: Record<string, number>;
  files: RepoFile[];
  folders: string[];
  fetchedAt: string;
}

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

interface GitHubCommitStats {
  total: number;
  weeks: Array<{ w: number; a: number; d: number; c: number }>;
}

// ----- Constants -----
const MAX_FILES = 500;
const GITHUB_API = 'https://api.github.com';

// ----- Helpers -----
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'CodebaseCity/1.0',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: getHeaders() });

  if (response.status === 404) {
    throw createError(404, 'Repository not found. Make sure it exists and is public.', 'REPO_NOT_FOUND');
  }
  if (response.status === 403) {
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      throw createError(429, 'GitHub API rate limit exceeded. Try again later or add a GITHUB_TOKEN.', 'GITHUB_RATE_LIMIT');
    }
    throw createError(403, 'Access denied. The repository may be private.', 'ACCESS_DENIED');
  }
  if (!response.ok) {
    throw createError(502, `GitHub API returned ${response.status}`, 'GITHUB_API_ERROR');
  }

  return response.json() as Promise<T>;
}

// ----- Get default branch -----
async function getDefaultBranch(owner: string, repo: string): Promise<string> {
  const data = await githubFetch<{ default_branch: string }>(
    `${GITHUB_API}/repos/${owner}/${repo}`,
  );
  return data.default_branch;
}

// ----- Fetch file tree -----
async function fetchRepoTree(owner: string, repo: string, branch: string): Promise<GitHubTreeItem[]> {
  const data = await githubFetch<GitHubTreeResponse>(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
  );
  return data.tree;
}

// ----- Fetch commit activity (basic) -----
async function fetchCommitActivity(owner: string, repo: string): Promise<Map<string, number>> {
  const commitMap = new Map<string, number>();

  try {
    await githubFetch<Array<{ sha: string; commit: { message: string } }>>(
      `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=100`,
    );

    const stats = await githubFetch<GitHubCommitStats[]>(
      `${GITHUB_API}/repos/${owner}/${repo}/stats/contributors`,
    );

    const totalCommits = stats.reduce((sum, contributor) => sum + contributor.total, 0);
    commitMap.set('__total__', totalCommits);
  } catch {
    console.warn('[github] Could not fetch commit activity, continuing without it');
  }

  return commitMap;
}

// ----- Binary file extensions to skip -----
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp', '.tiff',
  '.mp3', '.mp4', '.wav', '.ogg', '.webm', '.avi', '.mov',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.lock', '.map',
]);

function isBinaryFile(path: string): boolean {
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

// ----- Main service function -----
export async function fetchRepositoryData(owner: string, repo: string): Promise<RepoData> {
  console.log(`[github] Fetching data for ${owner}/${repo}`);

  // Step 1: Get default branch
  const branch = await getDefaultBranch(owner, repo);

  // Step 2: Fetch file tree
  const tree = await fetchRepoTree(owner, repo, branch);

  // Step 3: Fetch commit activity
  const commitActivity = await fetchCommitActivity(owner, repo);
  const totalCommits = commitActivity.get('__total__') || 0;

  // Step 4: Filter to only files (blobs), skip binary, sort by size desc
  const blobs = tree
    .filter((item) => item.type === 'blob' && item.size !== undefined && !isBinaryFile(item.path))
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, MAX_FILES);

  // Step 5: Collect all unique folders
  const folderSet = new Set<string>();
  tree
    .filter((item) => item.type === 'tree')
    .forEach((item) => folderSet.add(item.path));

  // Step 6: Build file objects
  const languageCounts: Record<string, number> = {};
  let totalLines = 0;
  let largestFileEntry: { name: string; size: number } = { name: '', size: 0 };

  const files: RepoFile[] = blobs.map((blob) => {
    const size = blob.size || 0;
    const lines = estimateLinesOfCode(size);
    const { language, color } = getLanguageInfo(blob.path);
    const name = blob.path.split('/').pop() || blob.path;
    const folder = blob.path.includes('/') ? blob.path.substring(0, blob.path.lastIndexOf('/')) : '/';

    const commitCount = totalCommits > 0
      ? Math.max(1, Math.round((size / blobs.reduce((s, b) => s + (b.size || 0), 0)) * totalCommits * 0.3))
      : Math.max(1, Math.round(Math.random() * 20));

    const isFrequentlyUpdated = commitCount > (totalCommits > 0 ? totalCommits / blobs.length * 2 : 10);

    totalLines += lines;
    languageCounts[language] = (languageCounts[language] || 0) + 1;

    if (size > largestFileEntry.size) {
      largestFileEntry = { name: blob.path, size };
    }

    folderSet.add(folder);

    return {
      path: blob.path,
      name,
      size,
      lines,
      language,
      color,
      folder,
      commitCount,
      isFrequentlyUpdated,
    };
  });

  // Step 7: Determine main language
  const mainLanguage = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Step 8: Normalize language breakdown to percentages
  const totalFileCount = files.length;
  const languageBreakdown: Record<string, number> = {};
  for (const [lang, count] of Object.entries(languageCounts)) {
    languageBreakdown[lang] = Math.round((count / totalFileCount) * 100);
  }

  const folders = Array.from(folderSet).sort();

  console.log(`[github] Processed ${files.length} files across ${folders.length} folders`);

  return {
    owner,
    repo,
    totalFiles: files.length,
    totalLines,
    mainLanguage,
    largestFile: largestFileEntry.name,
    languageBreakdown,
    files,
    folders,
    fetchedAt: new Date().toISOString(),
  };
}
