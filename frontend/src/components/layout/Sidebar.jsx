import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Settings, LogOut, PanelLeftClose, PanelLeftOpen, Plus, Edit2, Trash2, Check, X, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../common/ConfirmationModal';
import api from '../../services/api';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [chats, setChats] = useState([]);
  
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chat');
      if (data.success) {
        setChats(data.data);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  useEffect(() => {
    fetchChats();
    
    // Listen for custom events to sync chats across components
    const handleChatsChanged = () => fetchChats();
    window.addEventListener('chats-changed', handleChatsChanged);
    return () => window.removeEventListener('chats-changed', handleChatsChanged);
  }, []);

  const createNewChat = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/chat/create', { title: 'New Conversation' });
      if (data.success) {
        navigate(`/chat/${data.data._id}`);
        fetchChats();
        window.dispatchEvent(new Event('chats-changed'));
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
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

  const saveRename = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!editTitle.trim()) {
      cancelRename(e);
      return;
    }
    const updatedTitle = editTitle.trim();
    // Optimistic UI update
    setChats(prev => prev.map(c => c._id === id ? { ...c, title: updatedTitle } : c));
    setEditingChatId(null);

    try {
      await api.patch(`/chat/${id}/rename`, { title: updatedTitle });
      window.dispatchEvent(new Event('chats-changed'));
    } catch (err) {
      console.error('Failed to rename chat:', err);
      fetchChats(); // Revert
    }
  };

  const promptDelete = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chat);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    const delId = chatToDelete._id;
    
    // Optimistic UI update
    setChats(prev => prev.filter(c => c._id !== delId));
    setModalOpen(false);
    setChatToDelete(null);

    try {
      await api.delete(`/chat/${delId}`);
      window.dispatchEvent(new Event('chats-changed'));
      if (location.pathname === `/chat/${delId}`) {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      fetchChats(); // Revert
    }
  };

  // Check if we are anywhere inside the chat module
  const isChatActive = location.pathname.startsWith('/chat');

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-placeholder" title="DocuQuery AI">
          <Bot size={18} color="white" />
        </div>
        {!collapsed && <h2>DocuQuery AI</h2>}
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <p className="nav-label">WORKSPACE</p>}
          
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
            <LayoutDashboard size={20} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
          
          <NavLink to="/chat" className={`nav-item ${isChatActive ? 'active' : ''}`} title="Chat">
            <MessageSquare size={20} />
            {!collapsed && <span>Chat</span>}
          </NavLink>
          
          {/* Internal Chat History Section */}
          {isChatActive && !collapsed && (
            <div className="sidebar-history-section">
              <button className="new-chat-btn-small" onClick={createNewChat}>
                <Plus size={14} /> New Chat
              </button>
              
              <div className="sidebar-chat-list">
                {chats.map(chat => {
                  const isActiveChat = location.pathname === `/chat/${chat._id}`;
                  return (
                    <NavLink 
                      to={`/chat/${chat._id}`} 
                      key={chat._id} 
                      className={`sidebar-chat-item ${isActiveChat ? 'active' : ''}`}
                    >
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
                        <span className="sidebar-chat-title">{chat.title || 'Conversation'}</span>
                      )}
                      
                      {editingChatId !== chat._id && (
                        <div className="sidebar-chat-actions">
                          <button className="action-icon-btn" onClick={(e) => startRename(e, chat)} title="Rename">
                            <Edit2 size={12} />
                          </button>
                          <button className="action-icon-btn delete" onClick={(e) => promptDelete(e, chat)} title="Delete">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" title="Settings">
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className="nav-item exit-item" onClick={logout} title="Logout">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
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
    </aside>
  );
};

export default Sidebar;
