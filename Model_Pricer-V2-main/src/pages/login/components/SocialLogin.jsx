import React from 'react';
import ForgeButton from '../../../components/ui/forge/ForgeButton';
import Icon from '../../../components/AppIcon';

const SocialLogin = () => {
  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
  };

  const providers = [
    { name: 'Google', icon: 'Chrome' },
    { name: 'Facebook', icon: 'Facebook' },
    { name: 'Apple', icon: 'Apple' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '448px', margin: '0 auto' }}>
      {/* Divider */}
      <div style={{ position: 'relative', margin: '24px 0' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', borderTop: '1px solid var(--forge-border-default)' }} />
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <span style={{
            padding: '0 16px',
            backgroundColor: 'var(--forge-bg-surface)',
            color: 'var(--forge-text-muted)',
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            nebo se prihlaste pomoci
          </span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {providers.map((provider) => (
          <button
            key={provider.name}
            onClick={() => handleSocialLogin(provider.name)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              height: '44px',
              backgroundColor: 'var(--forge-bg-elevated)',
              border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-sm)',
              color: 'var(--forge-text-secondary)',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--forge-font-body)',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
              e.currentTarget.style.color = 'var(--forge-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--forge-border-default)';
              e.currentTarget.style.color = 'var(--forge-text-secondary)';
            }}
          >
            <Icon name={provider.icon} size={18} />
            Pokracovat s {provider.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SocialLogin;
