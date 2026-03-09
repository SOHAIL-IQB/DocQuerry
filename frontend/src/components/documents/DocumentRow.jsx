import React, { useState } from 'react';
import { FileText, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';

const DocumentRow = ({ document, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(document?.fileName || '');
  const [isRenaming, setIsRenaming] = useState(false);

  // Fallbacks if formatting is lost
  const fileSize = document?.fileSize || 0;
  const formattedSize = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
  const formattedDate = new Date(document?.createdAt || Date.now()).toLocaleDateString();
  const isProcessing = document?.status === 'Processing' || document?.status === 'processing';
  const isFailed = document?.status === 'Failed' || document?.status === 'failed';

  const handleRenameSubmit = async () => {
    if (!editName.trim() || editName === document.fileName) {
      setIsEditing(false);
      return;
    }
    setIsRenaming(true);
    await onRename(document._id, editName);
    setIsRenaming(false);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(document.fileName);
    }
  };

  return (
    <div className="document-row">
      <div className="doc-icon-wrapper">
        <FileText size={24} className={`doc-icon ${isProcessing ? 'processing' : 'ready'}`} />
      </div>
      
      <div className="doc-info">
        {isEditing ? (
          <div className="doc-rename-form">
            <input 
              type="text" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus 
              className="rename-input"
              disabled={isRenaming}
            />
            <button className="icon-btn success" onClick={handleRenameSubmit} disabled={isRenaming}>
              {isRenaming ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
            </button>
            <button className="icon-btn cancel" onClick={() => { setIsEditing(false); setEditName(document.fileName); }} disabled={isRenaming}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="doc-title">{document.fileName}</div>
        )}
        <div className="doc-meta">
          <span>{formattedSize}</span>
          <span className="dot-separator">•</span>
          <span>{formattedDate}</span>
          <span className="dot-separator">•</span>
          <span className={`doc-status ${isProcessing ? 'status-processing' : isFailed ? 'status-failed' : 'status-ready'}`}>
            {isProcessing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Loader2 size={12} className="spin" /> Generating embeddings...
              </span>
            ) : isFailed ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444' }}>
                <X size={12} /> Embedding failed
              </span>
            ) : 'Ready'}
          </span>
        </div>
      </div>

      <div className="doc-actions">
        {!isEditing && (
          <>
            <button className="action-btn" onClick={() => setIsEditing(true)} title="Rename" disabled={isProcessing}>
              <Edit2 size={16} />
            </button>
            <button className="action-btn delete" onClick={() => onDelete(document)} title="Delete" disabled={isProcessing}>
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentRow;
