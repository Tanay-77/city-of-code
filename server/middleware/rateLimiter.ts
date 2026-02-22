import rateLimit from 'express-rate-limit';

export const globalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

export const repoRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // 10 repo fetches per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message: 'Too many repository requests. Please wait before trying again.',
      code: 'REPO_RATE_LIMIT_EXCEEDED',
    },
  },
});
