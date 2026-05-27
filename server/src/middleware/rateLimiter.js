import rateLimit from 'express-rate-limit';

const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
  });

export const globalLimiter = createLimiter(15, 100, 'Too many requests, please try again later');

export const authLimiter = createLimiter(
  15,
  10,
  'Too many login attempts, please wait 15 minutes'
);

export const analysisLimiter = createLimiter(
  1,
  30,
  'Analysis rate limit reached, please slow down'
);
