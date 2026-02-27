const express = require('express');
const router = express.Router();
const { 
  uploadDocument, 
  getDocuments, 
  renameDocument, 
  deleteDocument 
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const { upload, checkStorageLimits } = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('document'), checkStorageLimits, uploadDocument);
router.get('/', protect, getDocuments);
router.patch('/:id/rename', protect, renameDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;
