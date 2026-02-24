import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '96px 0',
        color: 'var(--forge-text-muted, #7A8291)',
        fontFamily: 'var(--forge-font-heading)',
        fontSize: '14px',
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid var(--forge-border-default, #2A2F3A)',
          borderTop: '2px solid var(--forge-accent-primary, #00D4AA)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginRight: '12px',
        }} />
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
