import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { User, Bot, Smile, Star, Zap, Hexagon, Heart, Cpu, Loader2, Save, LogOut, Trash2, Moon, Sun } from 'lucide-react';
import './Settings.css';

const AVATARS = [
  { id: 'avatar1', icon: User },
  { id: 'avatar2', icon: Bot },
  { id: 'avatar3', icon: Smile },
  { id: 'avatar4', icon: Star },
  { id: 'avatar5', icon: Zap },
  { id: 'avatar6', icon: Hexagon },
  { id: 'avatar7', icon: Heart },
  { id: 'avatar8', icon: Cpu },
];

const Settings = () => {
  const { user, login, logout } = useAuth();
  
  // Profile State
  const [name, setName] = useState(user?.name || 'User');
  const [avatar, setAvatar] = useState(user?.avatar || 'avatar1');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Danger Zone State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Sync theme on mount
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage({ text: '', type: '' });

    try {
      const { data } = await api.patch('/users/profile', { name, avatar });
      if (data.success) {
        // Update local stored user while keeping the token intact
        const token = localStorage.getItem('token');
        login(token, data.data);
        setProfileMessage({ text: 'Profile updated successfully.', type: 'success' });
      }
    } catch (error) {
      setProfileMessage({ 
        text: error.response?.data?.error || 'Failed to update profile.', 
        type: 'error' 
      });
    } finally {
      setIsSavingProfile(false);
      setTimeout(() => setProfileMessage({ text: '', type: '' }), 5000);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      return setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
    }
    if (newPassword.length < 6) {
      return setPasswordMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
    }

    setIsSavingPassword(true);
    try {
      const { data } = await api.post('/users/change-password', { currentPassword, newPassword });
      if (data.success) {
        setPasswordMessage({ text: 'Password changed successfully.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setPasswordMessage({ 
        text: error.response?.data?.error || 'Failed to change password.', 
        type: 'error' 
      });
    } finally {
      setIsSavingPassword(false);
      setTimeout(() => setPasswordMessage({ text: '', type: '' }), 5000);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/users/account');
      logout(); // Force logout redirects to login
    } catch (error) {
      console.error('Failed to delete account', error);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const toggleTheme = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  return (
    <div className="settings-container page-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and application settings.</p>
      </div>

      <div className="settings-grid">
        {/* --- ACCOUNT SETTINGS --- */}
        <section className="settings-card">
          <div className="card-header">
            <h3>Account Settings</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateProfile} className="settings-form">
              
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={user?.email || ''} disabled className="input-disabled" />
              </div>

              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter your name"
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label>Profile Avatar</label>
                <div className="avatar-grid">
                  {AVATARS.map(({ id, icon: Icon }) => (
                    <button 
                      type="button" 
                      key={id} 
                      className={`avatar-btn ${avatar === id ? 'selected' : ''}`}
                      onClick={() => setAvatar(id)}
                    >
                      <Icon size={24} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={isSavingProfile || !name.trim()}>
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Profile
                    </>
                  )}
                </button>
                {profileMessage.text && (
                  <span className={`status-msg ${profileMessage.type}`}>{profileMessage.text}</span>
                )}
              </div>
            </form>

            <hr className="divider" />

            <form onSubmit={handleUpdatePassword} className="settings-form">
              <h4>Change Password</h4>
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn-primary outline" disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}>
                  {isSavingPassword ? (
                    <>
                      <Loader2 className="spin" size={18} />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
                {passwordMessage.text && (
                  <span className={`status-msg ${passwordMessage.type}`}>{passwordMessage.text}</span>
                )}
              </div>
            </form>
          </div>
        </section>

        <div className="settings-sidebar">
          {/* --- APPEARANCE --- */}
          <section className="settings-card">
            <div className="card-header">
              <h3>Appearance</h3>
            </div>
            <div className="card-body">
              <div className="theme-toggle-container">
                <button 
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => toggleTheme('dark')}
                >
                  <Moon size={20} />
                  <span>Dark Theme</span>
                </button>
                <button 
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => toggleTheme('light')}
                >
                  <Sun size={20} />
                  <span>Light Theme</span>
                </button>
              </div>
            </div>
          </section>

          {/* --- DANGER ZONE --- */}
          <section className="settings-card danger-zone">
            <div className="card-header">
              <h3 className="text-danger">Danger Zone</h3>
            </div>
            <div className="card-body">
              <p className="danger-text">
                Permanently delete your account, all uploaded documents, and associated chat history. This action cannot be reversed.
              </p>
              <button className="btn-destructive" onClick={() => setIsDeleteModalOpen(true)}>
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </section>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Account?"
        message="Are you absolutely sure you want to delete your account? This will permanently erase your profile, all uploaded files, embeddings, and chat histories. This action is irreversible."
        confirmText={isDeleting ? "Deleting..." : "Yes, Delete Account"}
        onCancel={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        isDestructive={true}
      />
    </div>
  );
};

export default Settings;
