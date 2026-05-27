import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDashboardStats } from '../services/fraudService.js';
import Transaction from '../models/Transaction.js';
import ScamMessage from '../models/ScamMessage.js';

const router = Router();

router.use(protect);

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [fraudStats, scamTotal, scamFlagged, recentScams] = await Promise.all([
      getDashboardStats(userId),
      ScamMessage.countDocuments({ userId }),
      ScamMessage.countDocuments({ userId, isScam: true }),
      ScamMessage.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // Weekly trend: last 7 days fraud transactions
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyData = await Transaction.aggregate([
      { $match: { userId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          flagged: { $sum: { $cond: ['$isFraud', 1, 0] } },
          avgRisk: { $avg: '$riskScore' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        fraud: fraudStats,
        scam: {
          total: scamTotal,
          flagged: scamFlagged,
          safe: scamTotal - scamFlagged,
          recent: recentScams,
        },
        weeklyTrend: weeklyData,
      },
    });
  })
);

export default router;
