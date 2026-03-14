import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import LoginForm from './components/LoginForm';
import '../../styles/animations.css';

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: 'var(--forge-bg-void)',
  color: 'var(--forge-text-primary)',
};

const containerStyle = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '48px 24px',
};

const cardStyle = {
  backgroundColor: 'var(--forge-bg-surface)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-lg)',
  padding: '32px',
};

export default function Login() {
  useDocumentTitle('Login');
  const { t } = useTranslation();
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  // Already logged in — redirect
  if (!loading && currentUser) {
    return <Navigate to={from} replace />;
  }

  // Show a minimal loading state while checking auth (prevents flash of login form)
  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '200px',
              height: '28px',
              borderRadius: 'var(--forge-radius-sm)',
              backgroundColor: 'var(--forge-bg-elevated)',
              margin: '0 auto 12px',
              animation: 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }} />
            <div style={{
              width: '280px',
              height: '16px',
              borderRadius: 'var(--forge-radius-sm)',
              backgroundColor: 'var(--forge-bg-elevated)',
              margin: '0 auto',
              animation: 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              animationDelay: '0.2s',
            }} />
          </div>
          <div style={{
            ...cardStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: '44px',
                borderRadius: 'var(--forge-radius-sm)',
                backgroundColor: 'var(--forge-bg-elevated)',
                animation: 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                animationDelay: `${i * 0.15}s`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: 'var(--forge-text-3xl)',
            fontWeight: 700,
            color: 'var(--forge-text-primary)',
            margin: '0 0 8px 0',
          }}>
            {t('loginPage.title', 'Prihlaste se')}
          </h1>
          <p style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: 'var(--forge-text-base)',
            color: 'var(--forge-text-muted)',
            margin: 0,
          }}>
            {t('loginPage.subtitle', 'Spravujte sve 3D tiskove projekty')}
          </p>
        </div>

        <div style={cardStyle}>
          <LoginForm redirectTo={from} />
        </div>
      </div>
    </div>
  );
}
