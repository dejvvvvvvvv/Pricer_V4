import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import LoginForm from './components/LoginForm';

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
