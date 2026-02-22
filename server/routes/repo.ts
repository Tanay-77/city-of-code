import { Router, Request, Response, NextFunction } from 'express';
import { validateAndParseGitHubUrl } from '../services/validator';
import { fetchRepositoryData, RepoData } from '../services/github';
import { MemoryCache } from '../services/cache';
import { repoRateLimiter } from '../middleware/rateLimiter';

const router = Router();
const cache = new MemoryCache<RepoData>(15); // 15-minute TTL

router.get('/repo', repoRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const url = req.query.url as string;

    // Validate and parse
    const { owner, repo } = validateAndParseGitHubUrl(url);
    const cacheKey = `${owner}/${repo}`.toLowerCase();

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`[cache] Hit for ${cacheKey}`);
      res.json({ success: true, data: cached, cached: true });
      return;
    }

    // Fetch from GitHub
    const data = await fetchRepositoryData(owner, repo);

    // Store in cache
    cache.set(cacheKey, data);

    res.json({ success: true, data, cached: false });
  } catch (error) {
    next(error);
  }
});

export { router as repoRouter };
