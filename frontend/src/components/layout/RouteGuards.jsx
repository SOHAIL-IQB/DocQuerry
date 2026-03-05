import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // If no user object, immediately bounce to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  // If already authenticated, block access to Login/Register and bounce into the app
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
