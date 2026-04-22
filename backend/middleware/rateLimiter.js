import rateLimit from 'express-rate-limit';

const shouldSkip = () => process.env.DISABLE_RATE_LIMIT === 'true'
                      || process.env.NODE_ENV === 'test';
// General API — 500 req per 15 min per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
  skip: shouldSkip, // disable in test/load test
});

// Auth endpoints — 100 req per 15 min per IP (generous for load testing)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts' },
  skip: req => process.env.DISABLE_RATE_LIMIT === 'true',
});