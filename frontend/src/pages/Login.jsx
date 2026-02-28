import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const { data } = await api.post('/auth/login', formData);
      
      if (data.success) {
        // Hydrate global auth context
        login(data.token, data.user);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <Layers size={24} />
          </div>
          <h1>Welcome back</h1>
          <p>Enter your credentials to access your workspace</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-error">
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="spin" /> Checking Details...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? 
          <Link to="/register" className="auth-link">Create one here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
