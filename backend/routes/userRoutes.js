const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/analytics', protect, getDashboardAnalytics);

module.exports = router;
