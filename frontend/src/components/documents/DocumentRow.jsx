import React, { useState } from 'react';
import { FileText, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';

const DocumentRow = ({ doc, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(doc.fileName);
  const [isRenaming, setIsRenaming] = useState(false);

  // Fallbacks if formatting is lost
  const fileSize = doc.fileSize || 0;
  const formattedSize = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
  const formattedDate = new Date(doc.createdAt || Date.now()).toLocaleDateString();
  const isProcessing = doc.status === 'processing';

  const handleRenameSubmit = async () => {
    if (!editName.trim() || editName === doc.fileName) {
      setIsEditing(false);
      return;
    }
    setIsRenaming(true);
    await onRename(doc._id, editName);
    setIsRenaming(false);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(doc.fileName);
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
            <button className="icon-btn cancel" onClick={() => { setIsEditing(false); setEditName(doc.fileName); }} disabled={isRenaming}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="doc-title">{doc.fileName}</div>
        )}
        <div className="doc-meta">
          <span>{formattedSize}</span>
          <span className="dot-separator">•</span>
          <span>{formattedDate}</span>
          <span className="dot-separator">•</span>
          <span className={`doc-status ${isProcessing ? 'status-processing' : 'status-ready'}`}>
            {isProcessing ? 'Processing...' : 'Ready'}
          </span>
        </div>
      </div>

      <div className="doc-actions">
        {!isEditing && (
          <>
            <button className="action-btn" onClick={() => setIsEditing(true)} title="Rename" disabled={isProcessing}>
              <Edit2 size={16} />
            </button>
            <button className="action-btn delete" onClick={() => onDelete(doc)} title="Delete" disabled={isProcessing}>
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentRow;
