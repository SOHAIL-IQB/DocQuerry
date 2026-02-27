const Document = require('../models/Document');
const User = require('../models/User');
const { extractText } = require('../utils/extractText');

// @desc    Upload and process a document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // 1. Create document record with status "Processing"
    const newDoc = await Document.create({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      status: 'Processing'
    });

    // 2. Extract Text
    let extractedText = '';
    try {
      extractedText = await extractText(req.file.buffer, req.file.mimetype);
      
      // Update document status to Ready (In Phase 4, we'll do chunking here before setting Ready)
      newDoc.status = 'Ready';
      await newDoc.save();

      // Update user's total storage used
      const user = await User.findById(req.user._id);
      user.totalStorageUsed += req.file.size;
      await user.save();

      res.status(201).json({
        success: true,
        data: newDoc
      });

    } catch (extractionError) {
      newDoc.status = 'Failed';
      await newDoc.save();
      return res.status(500).json({ success: false, error: extractionError.message });
    }
  } catch (error) {
    console.error('uploadDocument catch:', error.stack);
    res.status(500).json({ success: false, error: 'uploadDocument: ' + error.message });
  }
};

// @desc    Get all documents for a user
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user._id }).sort({ uploadDate: -1 });
    res.json({ success: true, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Rename a document
// @route   PATCH /api/documents/:id/rename
// @access  Private
const renameDocument = async (req, res) => {
  try {
    const { newName } = req.body;
    
    if (!newName) {
      return res.status(400).json({ success: false, error: 'New name is required' });
    }

    const document = await Document.findOne({ _id: req.params.id, userId: req.user._id });

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    document.fileName = newName;
    await document.save();

    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.user._id });

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Capture file size to deduct from user storage
    const sizeToDeduct = document.fileSize;

    // Delete document (In future phases, also delete vector chunks from DB!)
    await Document.deleteOne({ _id: req.params.id });

    // Update user's storage
    const user = await User.findById(req.user._id);
    user.totalStorageUsed = Math.max(0, user.totalStorageUsed - sizeToDeduct);
    await user.save();

    res.json({ success: true, data: { message: 'Document removed' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  renameDocument,
  deleteDocument
};
