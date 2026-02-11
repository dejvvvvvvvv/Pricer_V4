import React, { useState } from 'react';

/**
 * Forge-themed FAQ accordion.
 * Accepts array of items with flexible key names:
 *   {question, answer} or {q, a} or {title, content}
 */
export default function ForgeFaqAccordion({ items = [], className = '' }) {
  return (
    <div className={className}>
      {items.map((item, i) => (
        <FaqRow
          key={item.id || i}
          question={item.question || item.q || item.title}
          answer={item.answer || item.a || item.content}
        />
      ))}
    </div>
  );
}

function FaqRow({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--forge-border-default)' }}>
      <button
        className="w-full flex items-center justify-between py-5 text-left forge-transition-micro group"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        style={{ borderRadius: 'var(--forge-radius-sm)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--forge-bg-surface)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span
          style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: 'var(--forge-text-lg)',
            fontWeight: 500,
            color: 'var(--forge-text-primary)',
            paddingLeft: 8,
          }}
        >
          {question}
        </span>
        <span
          className="shrink-0 ml-4 forge-transition-micro"
          style={{
            fontFamily: 'var(--forge-font-mono)',
            fontSize: '24px',
            lineHeight: 1,
            color: isOpen ? 'var(--forge-accent-secondary)' : 'var(--forge-accent-primary)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            display: 'inline-block',
            paddingRight: 8,
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: isOpen ? '500px' : '0',
          overflow: 'hidden',
          transition: 'max-height 250ms ease',
        }}
      >
        <div
          className="pb-5"
          style={{
            fontFamily: 'var(--forge-font-body)',
            fontSize: 'var(--forge-text-base)',
            color: 'var(--forge-text-secondary)',
            lineHeight: '1.6',
            paddingLeft: 8,
          }}
        >
          {answer}
        </div>
      </div>
    </div>
  );
}
