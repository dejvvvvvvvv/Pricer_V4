import React from 'react';
import Icon from '../../../components/AppIcon';

const RoleSelectionCard = ({ role, isSelected, onSelect, title, description, benefits, icon }) => {
  const cardStyle = {
    position: 'relative',
    padding: '24px',
    borderRadius: 'var(--forge-radius-md)',
    border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-border-default)',
    backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.06)' : 'var(--forge-bg-elevated)',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
  };

  const indicatorStyle = {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-text-disabled)',
    backgroundColor: isSelected ? 'var(--forge-accent-primary)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const iconBoxStyle = {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--forge-radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    backgroundColor: isSelected ? 'var(--forge-accent-primary)' : 'var(--forge-bg-surface)',
    color: isSelected ? '#08090C' : 'var(--forge-text-muted)',
    border: isSelected ? 'none' : '1px solid var(--forge-border-default)',
  };

  return (
    <div
      onClick={() => onSelect(role)}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.4)';
          e.currentTarget.style.backgroundColor = 'var(--forge-bg-surface)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = 'var(--forge-border-default)';
          e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
        }
      }}
    >
      {/* Selection Indicator */}
      <div style={indicatorStyle}>
        {isSelected && <Icon name="Check" size={14} style={{ color: '#08090C' }} />}
      </div>

      {/* Role Icon */}
      <div style={iconBoxStyle}>
        <Icon name={icon} size={24} />
      </div>

      {/* Role Title */}
      <h3 style={{
        fontFamily: 'var(--forge-font-heading)',
        fontSize: 'var(--forge-text-lg)',
        fontWeight: 600,
        color: 'var(--forge-text-primary)',
        marginBottom: '8px',
      }}>{title}</h3>

      {/* Role Description */}
      <p style={{
        fontFamily: 'var(--forge-font-body)',
        fontSize: '13px',
        color: 'var(--forge-text-muted)',
        marginBottom: '16px',
        lineHeight: 1.5,
      }}>
        {description}
      </p>

      {/* Benefits List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {benefits?.map((benefit, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Icon
              name="Check"
              size={14}
              style={{
                marginTop: '2px',
                flexShrink: 0,
                color: isSelected ? 'var(--forge-accent-primary)' : 'var(--forge-text-disabled)',
              }}
            />
            <span style={{
              fontSize: '12px',
              color: 'var(--forge-text-muted)',
              fontFamily: 'var(--forge-font-body)',
            }}>{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelectionCard;
