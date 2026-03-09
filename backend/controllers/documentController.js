const Document = require('../models/Document');
const User = require('../models/User');
const DocumentChunk = require('../models/DocumentChunk');
const { extractText } = require('../utils/extractText');
const { chunkText } = require('../utils/chunkText');
const { generateEmbedding } = require('../utils/gemini');
const { retrieveRelevantChunks } = require('../services/ragService');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      
      // 3. Start asynchronous embedding generation in the background
      res.status(202).json({
        success: true,
        message: 'Document uploaded and is now processing in the background.',
        data: newDoc
      });

      // Execute vector embeddings asynchronously so the HTTP request doesn't timeout
      (async () => {
        try {
          console.log(`Document processing started: ${newDoc._id}`);
          const chunks = chunkText(extractedText);
          console.log(`Total chunks created: ${chunks.length}`);
          
          if (chunks.length > 500) {
            await Document.findByIdAndUpdate(newDoc._id, { status: 'Failed' });
            console.warn(`[UPLOAD ABORTED] Document chunks (${chunks.length}) exceed the high-volume safety threshold.`);
            return;
          }

          const chunkDocs = [];
          
          for (const [index, chunkTextStr] of chunks.entries()) {
            try {
              console.log(`Embedding chunk ${index + 1}/${chunks.length}`);
              const embedding = await generateEmbedding(chunkTextStr);
              
              chunkDocs.push({
                documentId: newDoc._id,
                userId: req.user.id,
                text: chunkTextStr,
                embedding: embedding,
                chunkIndex: index
              });
              
            } catch (err) {
              console.log(`Retrying embedding for chunk ${index + 1}...`);
              await sleep(2000);
              
              try {
                const retryEmbedding = await generateEmbedding(chunkTextStr);
                chunkDocs.push({
                  documentId: newDoc._id,
                  userId: req.user.id,
                  text: chunkTextStr,
                  embedding: retryEmbedding,
                  chunkIndex: index
                });
              } catch (retryErr) {
                console.error(`Second attempt failed for chunk ${index + 1}, skipping.`, retryErr);
              }
            }
            
            // 600ms buffer between chunks to pace Gemini Free Tier limits
            await sleep(600);
          }

          if (chunkDocs.length > 0) {
            await DocumentChunk.insertMany(chunkDocs);
          }

          console.log(`Document embedding completed: ${newDoc._id}`);

          // Update document status to Ready atomically
          await Document.findByIdAndUpdate(newDoc._id, { status: 'Ready' });

          // Update user's total storage used
          const userObj = await User.findById(req.user._id);
          userObj.totalStorageUsed += req.file.size;
          await userObj.save();

        } catch (backgroundError) {
          await Document.findByIdAndUpdate(newDoc._id, { status: 'Failed' });
          console.error(`Background processing error for document ${newDoc._id}:`, backgroundError);
        }
      })();

    } catch (extractionError) {
      newDoc.status = 'Failed';
      await newDoc.save();
      console.error('Processing error:', extractionError);
      if (!res.headersSent) {
          return res.status(500).json({ success: false, error: 'Processing failed: ' + extractionError.message });
      }
    }
  } catch (error) {
    console.error('uploadDocument catch:', error.stack);
    if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'uploadDocument: ' + error.message });
    }
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
