import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      {/* Logo */}
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '24px' }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--forge-radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--forge-accent-primary)',
          backgroundColor: 'var(--forge-bg-elevated)',
          border: '1px solid var(--forge-border-default)',
        }}>
          <Icon name="Layers3" size={28} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--forge-text-primary)',
            margin: 0,
          }}>
            ModelPricer
          </h1>
          <p style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '11px',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: 0,
          }}>
            3D PRINT PRICING
          </p>
        </div>
      </Link>

      {/* Welcome */}
      <div>
        <h2 style={{
          fontFamily: 'var(--forge-font-heading)',
          fontSize: 'var(--forge-text-2xl)',
          fontWeight: 700,
          color: 'var(--forge-text-primary)',
          margin: '0 0 8px 0',
        }}>
          Welcome Back
        </h2>
        <p style={{
          fontFamily: 'var(--forge-font-body)',
          fontSize: 'var(--forge-text-base)',
          color: 'var(--forge-text-muted)',
          margin: 0,
        }}>
          Sign in to continue
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;
