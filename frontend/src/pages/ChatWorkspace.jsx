import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader2, Info } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import api from '../services/api';
import './ChatWorkspace.css';

const ChatWorkspace = () => {
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  
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

  // Auto-select most recent chat if no chatId string
  useEffect(() => {
    if (!urlChatId) {
      const fetchLatestChat = async () => {
        try {
          const { data } = await api.get('/chat');
          if (data.success && data.data.length > 0) {
            // Redirect to the latest chat
            navigate(`/chat/${data.data[0]._id}`, { replace: true });
          }
        } catch (err) {
          console.error('Initial chat load failed:', err);
        }
      };
      // For Phase 8 we skip actual API Auth binding logic for this mockup wrapper
      // fetchLatestChat(); 
    }
  }, [urlChatId, navigate]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userQuery = input;
    setInput('');
    // Pass user question up to the hook resolver
    await sendMessage(userQuery);
  };

  return (
    <div className="chat-workspace">
      
      {/* Messages Container */}
      <div className="chat-messages-container">
        {messages.length === 0 && !isTyping ? (
          <div className="empty-chat-state">
            <Bot size={48} className="empty-icon" />
            <h2>How can I help you today?</h2>
            <p>Upload a document to begin asking questions across your knowledge base.</p>
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
          {message.content}
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
