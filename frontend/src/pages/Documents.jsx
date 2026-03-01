import React, { useState, useEffect } from 'react';
import api from '../services/api';
import UploadZone from '../components/documents/UploadZone';
import DocumentRow from '../components/documents/DocumentRow';
import StorageMeter from '../components/documents/StorageMeter';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import './Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { data } = await api.get('/documents');
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (err) {
      setError('Failed to load documents.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const totalBytes = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
  const isStorageExceeded = totalBytes >= 50 * 1024 * 1024; // 50MB

  const handleUpload = async (file) => {
    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('document', file);

    try {
      const { data } = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (data.success) {
        // Optimistically add to top
        setDocuments(prev => [data.data, ...prev]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRename = async (id, newName) => {
    try {
      const { data } = await api.put(`/documents/${id}`, { fileName: newName });
      if (data.success) {
        setDocuments(prev => prev.map(doc => doc._id === id ? { ...doc, fileName: data.data.fileName } : doc));
      }
    } catch (err) {
      setError('Failed to rename document.');
    }
  };

  const promptDelete = (doc) => {
    setDocToDelete(doc);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    const docId = docToDelete._id;
    
    // Optimistic UI
    setDocuments(prev => prev.filter(d => d._id !== docId));
    setModalOpen(false);
    setDocToDelete(null);

    try {
      await api.delete(`/documents/${docId}`);
    } catch (err) {
      // Revert if failed
      setError('Failed to delete document. Reloading...');
      fetchDocuments();
    }
  };

  return (
    <div className="documents-page">
      <div className="documents-header">
        <h1>Document Library</h1>
        <p>Manage your uploaded knowledge base. Changes immediately affect AI Chat context.</p>
      </div>

      {error && (
        <div className="global-error fade-in">
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      <div className="documents-top-panel">
        <div className="storage-panel">
          <StorageMeter totalUsedBytes={totalBytes} />
          {isStorageExceeded && (
            <div className="storage-warning fade-in">
              <AlertCircle size={14} /> Storage limit reached. Please delete an existing document to upload more.
            </div>
          )}
        </div>
        <div className="upload-panel">
          <UploadZone 
            onUpload={handleUpload} 
            isUploading={isUploading} 
            disabled={isStorageExceeded} 
          />
        </div>
      </div>

      <div className="documents-list-section">
        <div className="list-header">
          <h2>Your Documents</h2>
          <span className="doc-count">{documents.length} File{documents.length !== 1 ? 's' : ''}</span>
        </div>
        
        {isLoading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spin text-accent" />
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-docs-state fade-in">
            <div className="empty-icon-wrapper">
              <FileText size={40} />
            </div>
            <h3>No documents found</h3>
            <p>Upload your first document above to get started.</p>
          </div>
        ) : (
          <div className="docs-grid fade-in">
            {documents.map(doc => (
              <DocumentRow 
                key={doc._id} 
                doc={doc} 
                onDelete={promptDelete}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal 
        isOpen={modalOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${docToDelete?.fileName}"? This action cannot be undone and will permanently remove it from the chat context.`}
        confirmText="Delete Document"
        isDestructive={true}
        onCancel={() => setModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Documents;
