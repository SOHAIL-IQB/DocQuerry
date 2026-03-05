const Document = require('../models/Document');
const Chat = require('../models/Chat');
const User = require('../models/User');

// @desc    Get dashboard analytics for user
// @route   GET /api/user/analytics
// @access  Private
const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Run aggregations in parallel
    const [documentCount, chatCount, userRecord] = await Promise.all([
      Document.countDocuments({ userId }),
      Chat.countDocuments({ userId }),
      User.findById(userId).select('totalStorageUsed createdAt')
    ]);

    res.json({
      success: true,
      data: {
        totalDocuments: documentCount,
        totalChats: chatCount,
        storageUsedBytes: userRecord.totalStorageUsed || 0,
        memberSince: userRecord.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

module.exports = {
  getDashboardAnalytics
};
