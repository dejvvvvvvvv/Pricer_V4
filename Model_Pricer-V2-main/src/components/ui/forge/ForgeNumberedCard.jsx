import React from 'react';

export default function ForgeNumberedCard({ number, icon, title, description, className = '' }) {
  return (
    <div className={`forge-card-interactive group relative p-6 ${className}`}>
      {/* Monospace number label */}
      <span className="forge-numbered-label">{number}/</span>

      {/* Icon */}
      {icon && (
        <div className="mt-4 mb-4" style={{ color: 'var(--forge-accent-primary)' }}>
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="forge-h4 mb-2">{title}</h3>

      {/* Description */}
      <p className="forge-body" style={{ color: 'var(--forge-text-secondary)' }}>
        {description}
      </p>

      {/* Arrow on hover */}
      <div className="absolute bottom-6 right-6 forge-transition-micro group-hover:translate-x-1" style={{ color: 'var(--forge-text-muted)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
