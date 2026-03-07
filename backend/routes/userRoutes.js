const express = require('express');
const router = express.Router();
const { 
  getDashboardAnalytics, 
  updateProfile, 
  updatePassword, 
  deleteAccount 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/analytics', protect, getDashboardAnalytics);
router.patch('/profile', protect, updateProfile);
router.post('/change-password', protect, updatePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;
