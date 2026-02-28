import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, ProtectedRoute } from './components/layout/RouteGuards';
import AppLayout from './components/layout/AppLayout';
import ChatWorkspace from './pages/ChatWorkspace';
import Login from './pages/Login';
import Register from './pages/Register';
import Documents from './pages/Documents';

// Temporary Mock Pages
const Landing = () => <div style={{ padding: '40px', textAlign: 'center' }}><h1>DocuQuery AI</h1><p><a href="/login" style={{color: 'var(--accent-color)'}}>Go to Login</a></p></div>;

const Dashboard = () => <div><h1>Dashboard Overview</h1><p style={{color: 'var(--text-secondary)', marginTop: '8px'}}>Stats will appear here.</p></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes (Only accessible if NOT logged in) */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Application Routes wrapped in AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/chat" element={<ChatWorkspace />} />
              <Route path="/chat/:chatId" element={<ChatWorkspace />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
