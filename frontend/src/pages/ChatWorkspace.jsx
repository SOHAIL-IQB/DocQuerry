import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader2, Info, Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import api from '../services/api';
import ConfirmationModal from '../components/common/ConfirmationModal';
import './ChatWorkspace.css';

const ChatWorkspace = () => {
  const { chatId: urlChatId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [allChats, setAllChats] = useState([]);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  
  // Rename State
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  
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

  // Fetch all chats for the sidebar
  const fetchAllChats = async () => {
    try {
      const { data } = await api.get('/chat');
      if (data.success) {
        setAllChats(data.data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchAllChats();
  }, [urlChatId, isTyping]); // refresh sidebar when new chats are created or URL changes

  // Auto-select most recent chat if no chatId string
  useEffect(() => {
    if (!urlChatId) {
      const fetchLatestChat = async () => {
        try {
          const { data } = await api.get('/chat');
          if (data.success && data.data.length > 0) {
            navigate(`/chat/${data.data[0]._id}`, { replace: true });
          }
        } catch (err) {
          console.error('Initial chat load failed:', err);
        }
      };
      fetchLatestChat();
    }
  }, [urlChatId, navigate]);

  const promptDelete = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chat);
    setModalOpen(true);
  };

  const startRename = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(chat._id);
    setEditTitle(chat.title || 'Conversation');
  };

  const cancelRename = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(null);
    setEditTitle('');
  };

  const saveRename = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editTitle.trim()) {
      cancelRename(e);
      return;
    }

    // Optimistically update the sidebar and local state if we are currently looking at it
    const updatedTitle = editTitle.trim();
    setAllChats(prev => prev.map(c => 
      c._id === id ? { ...c, title: updatedTitle } : c
    ));
    setEditingChatId(null);

    try {
      await api.patch(`/chat/${id}/rename`, { title: updatedTitle });
    } catch (err) {
      console.error('Failed to rename chat:', err);
      // Optional: Revert on fail
    }
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    const delId = chatToDelete._id;
    
    // Optimistic cache removal
    setAllChats(prev => prev.filter(c => c._id !== delId));
    setModalOpen(false);
    setChatToDelete(null);

    try {
      await api.delete(`/chat/${delId}`);
      if (delId === urlChatId) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete chat', err);
      fetchAllChats(); // revert if failed
    }
  };

  const createNewChat = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/chat/create', { title: 'New Conversation' });
      if (data.success) {
        navigate(`/chat/${data.data._id}`);
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    
    const userQuery = input;
    setInput('');
    // Pass user question up to the hook resolver
    await sendMessage(userQuery);
  };

  return (
    <div className="chat-layout">
      {/* Sidebar History */}
      <div className="chat-sidebar-history">
        <div className="sidebar-history-header">
          <h3>Chat History</h3>
          <button onClick={createNewChat} className="new-chat-btn" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.95rem', width: '100%' }}>
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="sidebar-history-list">
          {allChats.map(chat => (
            <Link 
              to={`/chat/${chat._id}`} 
              key={chat._id} 
              className={`history-chat-row ${urlChatId === chat._id ? 'active' : ''}`}
            >
              <div className="history-chat-left">
                <MessageSquare size={16} />
                {editingChatId === chat._id ? (
                  <div className="sidebar-rename-form" onClick={(e) => e.preventDefault()}>
                     <input 
                       type="text"
                       className="sidebar-rename-input"
                       value={editTitle}
                       onChange={e => setEditTitle(e.target.value)}
                       onClick={e => e.preventDefault()}
                       autoFocus
                       onKeyDown={e => {
                         if (e.key === 'Enter') saveRename(e, chat._id);
                         if (e.key === 'Escape') cancelRename(e);
                       }}
                     />
                     <button className="icon-btn success" onClick={(e) => saveRename(e, chat._id)} title="Save">
                       <Check size={14} />
                     </button>
                     <button className="icon-btn cancel" onClick={cancelRename} title="Cancel">
                       <X size={14} />
                     </button>
                  </div>
                ) : (
                  <div className="history-chat-texts">
                    <span className="history-chat-title">{chat.title || 'Conversation'}</span>
                  </div>
                )}
              </div>
              
              {editingChatId !== chat._id && (
                <div className="history-chat-actions">
                  <button 
                    className="history-rename-btn" 
                    onClick={(e) => startRename(e, chat)}
                    title="Rename Chat"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className="history-delete-btn" 
                    onClick={(e) => promptDelete(e, chat)}
                    title="Delete Chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

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

      <ConfirmationModal 
        isOpen={modalOpen}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${chatToDelete?.title}"?`}
        confirmText="Delete Chat"
        isDestructive={true}
        onCancel={() => setModalOpen(false)}
        onConfirm={confirmDelete}
      />
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
