import { createError } from '../middleware/errorHandler';

const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)\/?.*$/;

export interface ParsedRepo {
  owner: string;
  repo: string;
}

export function validateAndParseGitHubUrl(url: string): ParsedRepo {
  if (!url || typeof url !== 'string') {
    throw createError(400, 'Repository URL is required.', 'MISSING_URL');
  }

  const trimmed = url.trim();

  if (trimmed.length > 500) {
    throw createError(400, 'URL is too long.', 'URL_TOO_LONG');
  }

  const match = trimmed.match(GITHUB_URL_REGEX);
  if (!match) {
    throw createError(
      400,
      'Invalid GitHub URL. Expected format: https://github.com/owner/repo',
      'INVALID_GITHUB_URL',
    );
  }

  const owner = match[2];
  const repo = match[3].replace(/\.git$/, '');

  // Sanitize: only allow safe characters
  if (!/^[a-zA-Z0-9\-_.]+$/.test(owner) || !/^[a-zA-Z0-9\-_.]+$/.test(repo)) {
    throw createError(400, 'Repository owner or name contains invalid characters.', 'INVALID_CHARS');
  }

  return { owner, repo };
}
