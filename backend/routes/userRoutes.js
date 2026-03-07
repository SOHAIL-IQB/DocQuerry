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
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;
