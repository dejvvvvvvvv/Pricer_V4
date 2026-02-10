import React from 'react';
import { Link } from 'react-router-dom';
import ForgeButton from '../../../components/ui/forge/ForgeButton';
import Icon from '../../../components/AppIcon';

const LoginActions = () => {
  const dividerStyle = {
    position: 'relative',
    margin: '24px 0',
  };

  const lineStyle = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
  };

  const labelStyle = {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
  };

  return (
    <div style={{ width: '100%', maxWidth: '448px', margin: '0 auto' }}>
      {/* Forgot Password Link */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Link
          to="/forgot-password"
          style={{
            fontSize: '13px',
            color: 'var(--forge-accent-primary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'opacity 150ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <Icon name="HelpCircle" size={14} />
          <span>Zapomenuji heslo?</span>
        </Link>
      </div>

      {/* Divider */}
      <div style={dividerStyle}>
        <div style={lineStyle}>
          <div style={{ width: '100%', borderTop: '1px solid var(--forge-border-default)' }} />
        </div>
        <div style={labelStyle}>
          <span style={{
            padding: '0 16px',
            backgroundColor: 'var(--forge-bg-surface)',
            color: 'var(--forge-text-muted)',
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Nemate ucet?
          </span>
        </div>
      </div>

      {/* Create Account Button */}
      <ForgeButton
        variant="outline"
        onClick={() => window.location.href = '/register'}
        style={{ width: '100%', marginBottom: '16px' }}
      >
        Vytvorit novy ucet
      </ForgeButton>

      {/* Demo Credentials Info */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: 'var(--forge-bg-elevated)',
        borderRadius: 'var(--forge-radius-md)',
        border: '1px solid var(--forge-border-default)',
      }}>
        <h4 style={{
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'var(--forge-font-tech)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--forge-text-primary)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Icon name="Info" size={16} style={{ color: 'var(--forge-accent-primary)' }} />
          Demo credentials
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Customer', email: 'customer@communprinting.cz', pass: 'customer123' },
            { label: 'Host', email: 'host@communprinting.cz', pass: 'host123' },
            { label: 'Admin', email: 'admin@communprinting.cz', pass: 'admin123' },
          ].map((cred) => (
            <div key={cred.label} style={{ fontSize: '11px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)' }}>
              <span style={{ color: 'var(--forge-accent-primary)', fontWeight: 600 }}>{cred.label}:</span>{' '}
              {cred.email} / {cred.pass}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginActions;
