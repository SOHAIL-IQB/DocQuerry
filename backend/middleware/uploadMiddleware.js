const multer = require('multer');
const Document = require('../models/Document');

// Max limits as per PRD
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_STORAGE = 50 * 1024 * 1024; // 50MB
const MAX_DOCUMENTS = 20;

// Set up Multer memory storage (buffers the file in memory)
const storage = multer.memoryStorage();

// Multer upload instance with size tracking
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE // Enforcement 1: 10MB maximum per file
  },
  fileFilter: (req, file, cb) => {
    // Optional: Filter file types (PDF, DOCX, TXT)
    const allowedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT are supported.'));
    }
  }
});

// Middleware to enforce user-level storage and document count limits
const checkStorageLimits = async (req, res, next) => {
  try {
    // If no file, let the controller handle it
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const newFileSize = req.file.size;
    const user = req.user; // populated by auth middleware

    // Count existing documents for this user
    const documentCount = await Document.countDocuments({ userId: user._id });

    // Enforcement 2: Maximum 20 documents per user
    if (documentCount >= MAX_DOCUMENTS) {
      return res.status(403).json({ 
        success: false, 
        error: 'Document limit exceeded. Maximum 20 documents allowed per user.' 
      });
    }

    // Enforcement 3: 50MB total storage per user
    if (user.totalStorageUsed + newFileSize > MAX_TOTAL_STORAGE) {
      return res.status(403).json({ 
        success: false, 
        error: 'Storage limit exceeded. Please delete documents to continue.' 
      });
    }

    next();
  } catch (error) {
    console.error('checkStorageLimits catch:', error.stack);
    res.status(500).json({ success: false, error: 'checkStorageLimits: ' + error.message });
  }
};

module.exports = {
  upload,
  checkStorageLimits
};
