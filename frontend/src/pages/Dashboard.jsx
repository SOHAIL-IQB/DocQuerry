import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Layers, FileText, MessageSquare, HardDrive, ArrowRight, Loader2, Bot, Trash2, Edit2, Check, X } from 'lucide-react';
import ConfirmationModal from '../components/common/ConfirmationModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  // Rename State
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fire parallel requests for speed
        const [analyticsRes, chatsRes] = await Promise.all([
          api.get('/user/analytics'),
          api.get('/chat')
        ]);
        
        if (analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
        
        if (chatsRes.data.success) {
           // Allow discovery of all chats
          setRecentChats(chatsRes.data.data);
        }

      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const promptDelete = (e, chat) => {
    e.preventDefault(); // Prevent navigating to the chat
    e.stopPropagation();
    setChatToDelete(chat);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    const chatId = chatToDelete._id;
    
    // Optimistic UI updates
    setRecentChats(prev => prev.filter(c => c._id !== chatId));
    setAnalytics(prev => ({
      ...prev,
      totalChats: Math.max(0, prev.totalChats - 1)
    }));
    
    setModalOpen(false);
    setChatToDelete(null);

    try {
      await api.delete(`/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to delete chat', err);
      // Could trigger an error toast here or reload the dashboard
    }
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

  const saveRename = async (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editTitle.trim()) {
      cancelRename(e);
      return;
    }

    // Optimistic UI update
    setRecentChats(prev => prev.map(c => 
      c._id === chatId ? { ...c, title: editTitle.trim() } : c
    ));
    setEditingChatId(null);
    
    try {
      await api.patch(`/chat/${chatId}/rename`, { title: editTitle.trim() });
    } catch (err) {
      console.error('Failed to rename chat:', err);
      // Revert if API fails? In a robust app, yes.
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

  // Formatting helpers
  const storageUsedMB = analytics ? (analytics.storageUsedBytes / (1024 * 1024)).toFixed(2) : 0;
  const storageLimitMB = 50;
  const storagePercent = Math.min((analytics?.storageUsedBytes / (50 * 1024 * 1024)) * 100, 100) || 0;

  return (
    <div className="dashboard-container fade-in">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || 'User'}</h1>
          <p>Here's an overview of your AI knowledge workspace today.</p>
        </div>
        <Link to="/chat" className="btn-primary">
          <MessageSquare size={16} /> New Chat
        </Link>
      </header>

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
          <div className="metric-icon orange">
            <HardDrive size={24} />
          </div>
          <div className="metric-info storage-info">
            <span className="metric-label">Storage Used (50MB Limit)</span>
            <div className="storage-bar-wrapper">
              <div 
                className={`storage-fill ${storagePercent > 90 ? 'danger' : storagePercent > 75 ? 'warning' : ''}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
             <span className="storage-text">{storageUsedMB} MB / {storageLimitMB} MB</span>
          </div>
        </div>
      </section>

      {/* Main Layout Area */}
      <div className="dashboard-content-grid">
        {/* Recent Chats Panel */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Recent Conversations</h3>
          </div>
          <div className="panel-body">
            {recentChats.length === 0 ? (
              <div className="empty-state-small">
                <Bot size={24} />
                <p>No conversations yet.</p>
                <Link to="/chat" className="text-accent">Start a new chat →</Link>
              </div>
            ) : (
              <div className="recent-list" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                {recentChats.map(chat => (
                  <div key={chat._id} className="recent-chat-row-container" style={{ position: 'relative' }}>
                    <Link to={`/chat/${chat._id}`} className="recent-chat-row">
                      <div className="chat-row-left">
                        <MessageSquare size={16} className="text-secondary" />
                        {editingChatId === chat._id ? (
                          <div className="doc-rename-form" onClick={e => e.preventDefault()}>
                            <input 
                              type="text"
                              className="rename-input"
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
                          <span className="chat-title">{chat.title || 'Conversation'}</span>
                        )}
                      </div>
                      <div className="chat-row-right">
                        <span className="chat-date">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                        {editingChatId !== chat._id && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              className="rename-chat-btn" 
                              onClick={(e) => startRename(e, chat)}
                              title="Rename Chat"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              className="delete-chat-btn" 
                              onClick={(e) => promptDelete(e, chat)}
                              title="Delete Chat"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        <ArrowRight size={14} className="hover-arrow" />
                      </div>
                    </Link>
                  </div>
                ))}
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
            <Link to="/documents" className="action-card">
              <div className="action-icon">
                <FileText size={20} />
              </div>
              <div className="action-text">
                <h4>Upload Document</h4>
                <p>Add context for the AI</p>
              </div>
            </Link>
            
            <Link to="/chat" className="action-card">
              <div className="action-icon">
                <MessageSquare size={20} />
              </div>
              <div className="action-text">
                <h4>Ask a Question</h4>
                <p>Chat with your knowledge</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={modalOpen}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${chatToDelete?.title}"? This conversation history cannot be recovered.`}
        confirmText="Delete Chat"
        isDestructive={true}
        onCancel={() => setModalOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Dashboard;
