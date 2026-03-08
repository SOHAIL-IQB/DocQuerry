import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, AlertCircle, Loader2 } from 'lucide-react';

const PROGRESS_MESSAGES = [
  "Analyzing document...",
  "Generating embeddings...",
  "Preparing AI search..."
];

const UploadZone = ({ onUpload, isUploading, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isUploading) {
      setMessageIndex(0);
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
      }, 3000);
    } else {
      setMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const validateAndUpload = (file) => {
    setError('');
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds 10MB limit.');
      return;
    }

    const validExtensions = ['pdf', 'docx', 'txt'];
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Looser mime type check with strict extension fallback
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      setError('Invalid file type. Only PDF, DOCX, and TXT are supported.');
      return;
    }

    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="upload-zone-wrapper">
      <div 
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${disabled || isUploading ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
          disabled={disabled || isUploading}
        />
        
        {isUploading ? (
          <div className="upload-processing">
            <Loader2 className="spin" size={36} color="var(--accent-color)" />
            <p style={{ fontWeight: 500, color: 'var(--text-primary)', marginTop: '4px' }}>
              {PROGRESS_MESSAGES[messageIndex]}
            </p>
          </div>
        ) : (
          <div className="upload-content text-center">
            <div className="upload-icon-wrapper">
              <UploadCloud size={28} />
            </div>
            <h3>Click or drag to upload</h3>
            <p className="upload-subtext">Supports PDF, DOCX, TXT (Max 10MB)</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="upload-error">
          <AlertCircle size={14} /> <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
