import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Bot, Loader2, Info, FileText, ChevronDown, CheckSquare, Square, UploadCloud, Paperclip } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AvatarIcon from '../components/common/AvatarIcon';
import './ChatWorkspace.css';

const ChatWorkspace = () => {
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  
  // Document Context Selector
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Inline Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch documents for the selector
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const { data } = await api.get('/documents');
        if (data.success) {
          setDocuments(data.data);
        }
      } catch (error) {
        console.error('Failed to load documents for chat selector', error);
      }
    };
    fetchDocuments();
  }, []);

  // Monitor Processing Status and Poll
  useEffect(() => {
    let pollInterval;
    if (documents.some(doc => doc.status === 'Processing')) {
      pollInterval = setInterval(async () => {
        try {
          const { data } = await api.get('/documents');
          if (data.success) {
            
            // Check if any processing docs finished since last poll
            const newDocs = data.data;
            const newlyReady = newDocs.filter(nDoc => 
              nDoc.status === 'Ready' && 
              documents.find(oDoc => oDoc._id === nDoc._id && oDoc.status === 'Processing')
            );
            
            if (newlyReady.length > 0) {
               alert("Document is ready for AI queries.");
            }
            
            setDocuments(newDocs);
          }
        } catch (err) {
          console.error("Failed to poll documents", err);
        }
      }, 5000);
    }
    return () => clearInterval(pollInterval);
  }, [documents]);
  
  // Custom Hook initialized with URL param
  const { 
    chatId, 
    setChatId, 
    messages, 
    isTyping, 
    error, 
    sendMessage 
  } = useChat(urlChatId);

  const endOfMessagesRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Sync URL ID changes with Hook State
  useEffect(() => {
    if (urlChatId !== chatId) setChatId(urlChatId);
  }, [urlChatId, setChatId, chatId]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  // ----- Inline Upload Logic ----- 
  
  const processUpload = async (file) => {
    if (!file) return;
    
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!validTypes.includes(file.type)) {
      alert('Only PDF, DOCX, and TXT files are allowed.');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('document', file);
      
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (data.success) {
        // Add the new document to the list and auto-select it
        const newDoc = data.data;
        setDocuments(prev => [newDoc, ...prev]);
        setSelectedDocuments(prev => {
          if (!prev.includes(newDoc._id)) {
             return [...prev, newDoc._id];
          }
          return prev;
        });

        // Inform user about background processing if response is 202
        if (data.message && data.message.includes('background')) {
            alert('Document uploaded! Note: Large documents may still be generating AI embeddings in the background for a few minutes.');
        }
      }
    } catch (err) {
      console.error('Upload failed inline:', err);
      // Backend handles size limits and sends 400s
      alert(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processUpload(e.target.files[0]);
    }
  };

  // ----- Drag and Drop Core Handlers -----

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUpload(e.dataTransfer.files[0]);
    }
  };

  // ----- Chat Query Logic -----

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userQuery = input;
    setInput('');
    // Pass user question up to the hook resolver along with document specifiers array
    await sendMessage(userQuery, selectedDocuments.length > 0 ? selectedDocuments : []);
    
    // Tell unified sidebar we either created or implicitly updated a chat
    window.dispatchEvent(new Event('chats-changed'));
  };

  return (
    <div className="chat-layout">
      {/* Main Workspace */}
      <div className="chat-workspace">
        {/* Messages Container */}
        <div className="chat-messages-container">
          {(!messages || messages.length === 0) && !isTyping ? (
            <div className="empty-chat-state">
              <Bot size={48} className="empty-icon" />
              <h2>Start a new conversation.</h2>
              <p>Ask a question about your uploaded documents.</p>
            </div>
          ) : (
            <div className="chat-messages-content">
              {messages.map((msg, index) => (
                <MessageBubble key={msg._id || index} message={msg} userAvatar={user?.avatar} />
              ))}
              
              {isTyping && (
                <div className="message-wrapper assistant">
                  <div className="message-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="message-bubble typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="chat-error-banner">
             <Info size={16} /> <span>{error}</span>
          </div>
        )}

        {/* Input Form with Drag and Drop Support */}
        <div 
          className={`chat-input-container ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {dragActive && (
            <div className="drag-overlay">
              <UploadCloud size={48} className="bounce" />
              <p>Drop to upload document instantly</p>
            </div>
          )}
          
          <form onSubmit={handleSend} className="chat-input-form relative">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isUploading ? "Uploading and extracting document context..." : "Ask a question about your documents..."}
              disabled={isTyping || isUploading}
            />
            
            <div className="chat-input-controls flex-controls">
              {/* Document Selector Header Box */}
              {documents.length > 0 && (
                <div className="custom-dropdown-container" ref={dropdownRef}>
                  <div 
                    className="inline-selector-wrapper" 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <FileText size={14} className="selector-icon" />
                    <div className="selector-label">
                      {selectedDocuments.length === 0 ? (
                        <span>All Documents</span>
                      ) : selectedDocuments.length <= 2 ? (
                        selectedDocuments.map(id => {
                          const docObj = documents.find(d => d._id === id);
                          if (!docObj) return null;
                          return (
                            <span key={id} className="selected-tag" title={docObj.fileName}>
                              {docObj.fileName}
                            </span>
                          );
                        })
                      ) : (
                        <span className="selected-tag">{selectedDocuments.length} Selected</span>
                      )}
                    </div>
                    <ChevronDown size={14} className="selector-chevron" />
                  </div>
                  
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <div 
                        className={`dropdown-item ${selectedDocuments.length === 0 ? 'active' : ''}`}
                        onClick={() => setSelectedDocuments([])}
                      >
                         <div className="checkbox-icon">
                           {selectedDocuments.length === 0 ? <CheckSquare size={16} color="var(--accent-color)" /> : <Square size={16} />}
                         </div>
                         <span>All Documents</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      
                      <div className="dropdown-scroll-area">
                        {documents.map(doc => {
                          const isSelected = selectedDocuments.length === 0 || selectedDocuments.includes(doc._id);
                          const isProcessing = doc.status === 'Processing';
                          const isFailed = doc.status === 'Failed';
                          const isDisabled = isProcessing || isFailed;
                          
                          return (
                            <div 
                              key={doc._id} 
                              className={`dropdown-item ${isSelected ? 'active' : ''}`}
                              onClick={() => !isDisabled && toggleDocumentSelection(doc._id)}
                              style={{ 
                                opacity: isDisabled ? 0.5 : 1, 
                                cursor: isDisabled ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <div className="checkbox-icon">
                                 {isSelected ? <CheckSquare size={16} color="var(--accent-color)" /> : <Square size={16} />}
                              </div>
                              <span title={doc.fileName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {doc.fileName.length > 20 ? doc.fileName.substring(0, 20) + '...' : doc.fileName}
                                {isProcessing && <Loader2 size={12} className="spin" color="var(--accent-color)" />}
                                {isFailed && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>Failed</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Inline Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              
              {/* Upload Trigger Button */}
              <button
                type="button"
                className="chat-upload-trigger-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isTyping}
                title="Upload Document"
              >
                {isUploading ? <Loader2 size={16} className="spin" /> : <Paperclip size={16} />}
              </button>
              
              <button 
                type="submit" 
                className="chat-submit-btn"
                disabled={!input.trim() || isTyping || isUploading}
              >
                {isTyping ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
          <div className="chat-footer-text">
            Responses are generated strictly from uploaded document context.
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Message Bubble
const MessageBubble = ({ message, userAvatar }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <AvatarIcon avatarId={userAvatar} size={18} /> : <Bot size={18} />}
      </div>
      <div className="message-bubble-container">
        <div className="message-bubble">
          {isUser ? (
             message.content 
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* Render Source Citations if they exist on Assistant Responses */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="message-sources">
            <div className="sources-label">Sources Used</div>
            <div className="sources-list">
              {message.sources.map((src, i) => (
                <div key={i} className="source-chip" title={src.chunkText}>
                  📄 Doc {src.documentId.substring(0, 4)}...
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWorkspace;
