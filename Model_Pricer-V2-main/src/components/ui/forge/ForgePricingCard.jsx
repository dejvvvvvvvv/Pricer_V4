import React from 'react';
import ForgeButton from './ForgeButton';

/**
 * Forge-themed pricing plan card.
 * Recommended card gets accent border + glow.
 */
export default function ForgePricingCard({
  name,
  price,
  period,
  features = [],
  ctaText,
  ctaTo,
  recommended = false,
  className = '',
}) {
  return (
    <div
      className={`relative p-6 h-full flex flex-col ${className}`}
      style={{
        background: 'var(--forge-bg-surface)',
        border: recommended
          ? '1px solid var(--forge-accent-primary)'
          : '1px solid var(--forge-border-default)',
        borderRadius: 'var(--forge-radius-md)',
        ...(recommended ? { boxShadow: '0 0 30px rgba(0,212,170,0.1)' } : {}),
      }}
    >
      {/* Recommended badge */}
      {recommended && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold"
          style={{
            background: 'var(--forge-accent-primary)',
            color: '#08090C',
            fontFamily: 'var(--forge-font-heading)',
            letterSpacing: '0.05em',
          }}
        >
          Recommended
        </div>
      )}

      {/* Plan name */}
      <span className="forge-label">{name}</span>

      {/* Price */}
      <div className="mt-4 mb-6">
        {price !== null ? (
          <>
            <span
              className="forge-mono-bold"
              style={{ fontSize: 'var(--forge-text-3xl)', color: 'var(--forge-text-primary)' }}
            >
              {price}
            </span>
            <span
              className="ml-2"
              style={{
                fontFamily: 'var(--forge-font-tech)',
                fontSize: 'var(--forge-text-sm)',
                color: 'var(--forge-text-muted)',
              }}
            >
              {period}
            </span>
          </>
        ) : (
          <span
            className="forge-mono-bold"
            style={{ fontSize: 'var(--forge-text-2xl)', color: 'var(--forge-text-primary)' }}
          >
            {period}
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2"
            style={{
              fontFamily: 'var(--forge-font-body)',
              fontSize: 'var(--forge-text-base)',
              color: 'var(--forge-text-secondary)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0 mt-0.5"
            >
              <path
                d="M3 8L6.5 11.5L13 5"
                stroke="var(--forge-accent-primary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-8">
        <ForgeButton
          to={ctaTo}
          variant={recommended ? 'primary' : 'outline'}
          size="md"
          fullWidth
        >
          {ctaText}
        </ForgeButton>
      </div>
    </div>
  );
}
