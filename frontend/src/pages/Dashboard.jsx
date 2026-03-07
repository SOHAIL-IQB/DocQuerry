import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Layers, FileText, MessageSquare, HardDrive, Loader2, FileText as FileIcon, AlertCircle } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import UploadZone from '../components/documents/UploadZone';
import DocumentRow from '../components/documents/DocumentRow';
import StorageMeter from '../components/documents/StorageMeter';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Document Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Modal State for Documents
  const [modalOpen, setModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [analyticsRes, docsRes] = await Promise.all([
          api.get('/user/analytics'),
          api.get('/documents')
        ]);
        
        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
        
        if (docsRes.data.success) {
          setDocuments(docsRes.data.data);
        }

      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
        setDocuments(prev => [data.data, ...prev]);
        setAnalytics(prev => ({
          ...prev,
          totalDocuments: (prev?.totalDocuments || 0) + 1,
          storageUsedBytes: (prev?.storageUsedBytes || 0) + (data.data.fileSize || 0)
        }));
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
    const deletedSize = docToDelete.fileSize || 0;
    
    // Optimistic UI updates
    setDocuments(prev => prev.filter(d => d._id !== docId));
    setAnalytics(prev => ({
      ...prev,
      totalDocuments: Math.max(0, (prev?.totalDocuments || 0) - 1),
      storageUsedBytes: Math.max(0, (prev?.storageUsedBytes || 0) - deletedSize)
    }));
    
    setModalOpen(false);
    setDocToDelete(null);

    try {
       await api.delete(`/documents/${docId}`);
    } catch (err) {
      console.error('Failed to delete document', err);
      setError('Failed to delete document. Please refresh.');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 size={32} className="spin text-accent" />
        <p>Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || 'User'}</h1>
          <p>Here's an overview of your AI knowledge workspace today.</p>
        </div>
      </header>
      
      {error && (
        <div className="global-error fade-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      {/* Analytics Main Widgets */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <FileText size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Documents</span>
            <span className="metric-value">{analytics?.totalDocuments || 0}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <Layers size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Chats</span>
            <span className="metric-value">{analytics?.totalChats || 0}</span>
          </div>
        </div>

        <div className="metric-card storage-card">
          <StorageMeter totalUsedBytes={totalBytes} />
        </div>
      </section>

      {/* Main Layout Area */}
      <div className="dashboard-content-grid">
        {/* Document Library Panel */}
        <div className="dashboard-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Document Library</h3>
            <span className="doc-count" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{documents.length} File{documents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
             {documents.length === 0 && !isUploading ? (
              <div className="empty-state-small" style={{ padding: '48px 24px' }}>
                <FileIcon size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p>No documents uploaded yet.</p>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Upload a document in the panel to get started.</div>
              </div>
            ) : (
              <div className="documents-list-section" style={{ padding: '16px' }}>
                 <div className="docs-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {documents.map(doc => (
                      <DocumentRow 
                        key={doc._id} 
                        doc={doc} 
                        onDelete={promptDelete}
                        onRename={handleRename}
                      />
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="panel-body actions-body">
            
            <div style={{ marginBottom: '16px' }}>
               <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Add Knowledge</h4>
               <UploadZone 
                 onUpload={handleUpload} 
                 isUploading={isUploading} 
                 disabled={isStorageExceeded} 
               />
               {isStorageExceeded && (
                 <div className="storage-warning" style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   <AlertCircle size={12} /> Storage limit reached.
                 </div>
               )}
            </div>

            <Link to="/chat" className="action-card" style={{ marginTop: 'auto' }}>
              <div className="action-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)' }}>
                <MessageSquare size={20} />
              </div>
              <div className="action-text">
                <h4>New AI Chat</h4>
                <p>Chat with your documents</p>
              </div>
            </Link>
          </div>
        </div>
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

export default Dashboard;
