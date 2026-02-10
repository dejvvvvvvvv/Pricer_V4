import React from 'react';
import { useNavigate } from 'react-router-dom';
import ForgeButton from '@/components/ui/forge/ForgeButton';
import Icon from '@/components/AppIcon';

const NotFound = () => {
  const navigate = useNavigate();

  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--forge-bg-void)',
    padding: '24px',
  };

  const codeStyle = {
    fontFamily: 'var(--forge-font-mono)',
    fontSize: '120px',
    fontWeight: 700,
    color: 'var(--forge-accent-primary)',
    opacity: 0.15,
    lineHeight: 1,
    letterSpacing: '-0.04em',
    userSelect: 'none',
  };

  const titleStyle = {
    fontFamily: 'var(--forge-font-heading)',
    fontSize: 'var(--forge-text-2xl)',
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    marginTop: '-20px',
    marginBottom: '8px',
  };

  const descStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-muted)',
    marginBottom: '32px',
    maxWidth: '400px',
    textAlign: 'center',
    lineHeight: 1.5,
  };

  return (
    <div style={pageStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={codeStyle}>404</div>
        <h2 style={titleStyle}>Page Not Found</h2>
        <p style={descStyle}>
          The coordinates you entered don't match any known location in our system.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <ForgeButton variant="primary" onClick={() => navigate('/')}>
            Back to Home
          </ForgeButton>
          <ForgeButton variant="outline" onClick={() => window.history?.back()}>
            Go Back
          </ForgeButton>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
