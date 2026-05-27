import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { analysisLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { analyzeScamMessage, getScamHistory } from '../services/scamService.js';

const router = Router();

router.use(protect);

router.post(
  '/analyze',
  analysisLimiter,
  [
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Message content is required')
      .isLength({ max: 5000 })
      .withMessage('Message too long (max 5000 characters)'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const result = await analyzeScamMessage({
      userId: req.user._id,
      content: req.body.content,
    });

    res.status(201).json({ success: true, data: result });
  })
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const history = await getScamHistory(req.user._id, limit);
    res.json({ success: true, data: history });
  })
);

export default router;
