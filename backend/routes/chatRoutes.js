const express = require('express');
const router = express.Router();
const { 
  createChat, 
  sendMessage, 
  getAllChats,
  getChatHistory, 
  deleteChat,
  renameChat
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createChat);
router.post('/message', protect, sendMessage);
router.get('/', protect, getAllChats);
router.get('/:chatId', protect, getChatHistory);
router.patch('/:chatId/rename', protect, renameChat);
router.delete('/:chatId', protect, deleteChat);

module.exports = router;
