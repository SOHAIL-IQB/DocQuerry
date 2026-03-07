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

// @desc    Update user profile & avatar
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        totalStorageUsed: updatedUser.totalStorageUsed,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/user/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    // Explicitly select password field to check it
    const user = await User.findById(req.user._id).select('+password');

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete user account and all associated data
// @route   DELETE /api/user/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete all documents belonging to user
    await Document.deleteMany({ userId });
    
    // Delete all chats belonging to user
    await Chat.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
  updateProfile,
  updatePassword,
  deleteAccount
};
