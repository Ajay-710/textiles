// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

const ProtectedRoute = () => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    // Show a loading spinner or a blank page while authentication is checked
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (error || !user) {
    // If there's an error or no user, redirect to the homepage
    return <Navigate to="/" replace />;
  }

  // If the user is logged in, render the child component (e.g., AdminLayout)
  return <Outlet />;
};

export default ProtectedRoute;