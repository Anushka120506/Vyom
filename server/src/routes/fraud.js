import { Router } from 'express';
import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { analysisLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { analyzeTransaction, getTransactionHistory } from '../services/fraudService.js';

const router = Router();

router.use(protect);

router.post(
  '/analyze',
  analysisLimiter,
  [
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('device').trim().notEmpty().withMessage('Device type is required'),
    body('merchantCategory').optional().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { amount, location, device, merchantCategory } = req.body;

    const result = await analyzeTransaction({
      userId: req.user._id,
      amount: parseFloat(amount),
      location,
      device,
      merchantCategory,
    });

    res.status(201).json({ success: true, data: result });
  })
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const history = await getTransactionHistory(req.user._id, limit);
    res.json({ success: true, data: history });
  })
);

export default router;
