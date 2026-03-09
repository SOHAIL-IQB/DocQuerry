const Document = require('../models/Document');
const User = require('../models/User');
const DocumentChunk = require('../models/DocumentChunk');
const { extractText } = require('../utils/extractText');
const { chunkText } = require('../utils/chunkText');
const { generateEmbedding, generateEmbeddingsBatch } = require('../utils/gemini');
const { retrieveRelevantChunks } = require('../services/ragService');

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
      userId: req.user.id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      status: 'Processing'
    });

    // 2. Extract Text
    let extractedText = '';
    try {
      extractedText = await extractText(req.file.buffer, req.file.mimetype);
      
      // 3. Chunk text and generate embeddings in batches
      const chunks = chunkText(extractedText);
      const chunkDocs = [];
      const BATCH_SIZE = 100; // Gemini limit for batch embeddings is typically 100
      
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batchChunks = chunks.slice(i, i + BATCH_SIZE);
        // Process up to BATCH_SIZE chunks in a single API request
        const batchEmbeddings = await generateEmbeddingsBatch(batchChunks);
        
        batchChunks.forEach((chunkTextStr, idx) => {
          chunkDocs.push({
            documentId: newDoc._id,
            userId: req.user.id,
            text: chunkTextStr,
            embedding: batchEmbeddings[idx],
            chunkIndex: i + idx
          });
        });
      }

      if (chunkDocs.length > 0) {
        await DocumentChunk.insertMany(chunkDocs);
      }

      // Update document status to Ready
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
      console.error('Processing error:', extractionError);
      return res.status(500).json({ success: false, error: 'Processing failed: ' + extractionError.message });
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
    const documents = await Document.find({ 
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    console.log("User ID:", req.user.id);
    console.log("Documents found:", documents.length);

    res.json({ 
      success: true, 
      data: documents 
    });
  } catch (error) {
    console.error("Fetch Documents Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
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

    // Delete document chunks from DB
    await DocumentChunk.deleteMany({ documentId: req.params.id });

    // Delete document
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
