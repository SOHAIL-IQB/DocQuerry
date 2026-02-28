import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ChatWorkspace from './pages/ChatWorkspace';

// Temporary Mock Pages
const Landing = () => <div style={{ padding: '40px', textAlign: 'center' }}><h1>Landing Page</h1><p><a href="/login" style={{color: 'var(--accent-color)'}}>Go to Login</a></p></div>;
const Login = () => <div style={{ padding: '40px', textAlign: 'center' }}><h1>Login Page</h1><p><a href="/dashboard" style={{color: 'var(--accent-color)'}}>Go to Dashboard (Auth Bypass for Mocking)</a></p></div>;
const Register = () => <div style={{ padding: '40px' }}><h1>Register Page</h1></div>;

const Dashboard = () => <div><h1>Dashboard Overview</h1><p style={{color: 'var(--text-secondary)', marginTop: '8px'}}>Stats will appear here.</p></div>;
const Documents = () => <div><h1>Document Library</h1><p style={{color: 'var(--text-secondary)', marginTop: '8px'}}>File management will appear here.</p></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Application Routes wrapped in AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/chat" element={<ChatWorkspace />} />
          <Route path="/chat/:chatId" element={<ChatWorkspace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
