import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import api from '../services/api';
import './ChatWorkspace.css';

const ChatWorkspace = () => {
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  
  // Document Context Selector
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState('');

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userQuery = input;
    setInput('');
    // Pass user question up to the hook resolver along with document specifier
    await sendMessage(userQuery, selectedDocumentId || null);
    
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
                <MessageBubble key={msg._id || index} message={msg} />
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

        {/* Input Form */}
        <div className="chat-input-container">
          {documents.length > 0 && (
            <div className="document-selector-container">
              <select 
                className="document-selector"
                value={selectedDocumentId}
                onChange={(e) => setSelectedDocumentId(e.target.value)}
                disabled={isTyping}
              >
                <option value="">All Documents</option>
                {documents.map(doc => (
                  <option key={doc._id} value={doc._id}>
                    {doc.fileName}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <form onSubmit={handleSend} className="chat-input-form">
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={isTyping}
            />
            <button 
              type="submit" 
              className="chat-submit-btn"
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
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
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? <User size={18} /> : <Bot size={18} />}
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
