const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { generateAnswer } = require('../services/ragService');

// Simple Greetings matcher
const GREETINGS = [
  "hello", "hi", "hey", "good morning", "good evening", 
  "how are you", "what can you do", "who are you"
];

const isGreeting = (msg) => {
  const cleanMsg = msg.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  return GREETINGS.includes(cleanMsg);
};

// @desc    Create a new chat
// @route   POST /api/chat/create
// @access  Private
const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({
      userId: req.user._id,
      title: req.body.title || 'New Chat'
    });

    res.status(201).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error in createChat:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Send a message to a chat
// @route   POST /api/chat/message
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { chatId, question, documentId } = req.body;

    if (!chatId || !question) {
      return res.status(400).json({ success: false, error: 'chatId and question are required' });
    }

    // 1. Fetch the chat
    const chat = await Chat.findById(chatId);

    // 2. Validate existence
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    // 3. Validate ownership using explicit bounds
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this chat' });
    }

    // 4. Save user message first
    await Message.create({
      chatId: chat._id,
      role: 'user',
      content: question
    });

    // 4.5 Auto-generate title for fresh chats
    if (chat.title === 'New Chat' || chat.title === 'New Conversation') {
      chat.title = question.substring(0, 40) + (question.length > 40 ? '...' : '');
      await chat.save();
    }

    // 5. Call RAG logic safely or bypass for greetings
    let aiResponse;
    if (isGreeting(question)) {
      aiResponse = {
        answer: "Hello! I'm your DocuQuery assistant.\n\nYou can upload documents such as PDFs, DOCX, or TXT files and ask questions about their content.\n\nHow can I help you today?",
        sources: []
      };
    } else {
      try {
        aiResponse = await generateAnswer(req.user._id, question, documentId || null);
      } catch (llmError) {
        console.error('generateAnswer error:', llmError);
        return res.status(500).json({ success: false, error: 'Failed to generate answer' });
      }
    }

    // 6. Save assistant message
    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: aiResponse.answer,
      sources: aiResponse.sources
    });

    // 7. Return payload
    res.status(201).json({
      success: true,
      data: {
        answer: assistantMessage.content,
        sources: assistantMessage.sources
      }
    });

  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/chat/:chatId
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    // 1. Fetch the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    // 2. Validate ownership safely
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to access this chat' });
    }

    // 3. Fetch specific messages ordered explicitly Ascending by creation
    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Delete a chat
// @route   DELETE /api/chat/:chatId
// @access  Private
const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    // 1. Fetch the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    // 2. Validate ownership safely
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this chat' });
    }

    // 3. Cascade Delete Safety - Delete child messages first
    await Message.deleteMany({ chatId: chat._id });

    // 4. Delete the chat itself
    await chat.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });

  } catch (error) {
    console.error('Error in deleteChat:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chat
// @access  Private
const getAllChats = async (req, res) => {
  try {
    // strict user filter
    const chats = await Chat.find({ userId: req.user._id }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Error in getAllChats:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

// @desc    Rename a chat
// @route   PATCH /api/chat/:chatId/rename
// @access  Private
const renameChat = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    // 1. Fetch the chat
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    // 2. Validate ownership safely
    if (chat.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to configure this chat' });
    }

    // 3. Update the title
    chat.title = title.trim();
    await chat.save();

    res.status(200).json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error('Error in renameChat:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

module.exports = {
  createChat,
  sendMessage,
  getAllChats,
  getChatHistory,
  deleteChat,
  renameChat
};
