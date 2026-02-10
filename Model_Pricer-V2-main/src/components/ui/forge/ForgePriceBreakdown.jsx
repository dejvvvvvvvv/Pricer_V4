import React from 'react';

/**
 * Forge-themed receipt-style price breakdown component.
 *
 * Props:
 *  - items: Array of { label, value }
 *  - subtotal: { label, value }
 *  - discount: { label, value } | null
 *  - tax: { label, value } | null
 *  - total: { label, value }
 *  - perUnit: string | null
 *  - className: string
 */
export default function ForgePriceBreakdown({
  items = [],
  subtotal,
  discount = null,
  tax = null,
  total,
  perUnit = null,
  className = '',
}) {
  const wrapperStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '24px',
  };

  const headerStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '10px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--forge-text-muted)',
    borderBottom: '1px solid var(--forge-border-default)',
    marginBottom: '16px',
    paddingBottom: '12px',
  };

  const lineItemStyle = (extraStyle = {}) => ({
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: '8px',
    ...extraStyle,
  });

  const labelStyle = (color) => ({
    fontFamily: 'var(--forge-font-body)',
    fontSize: '13px',
    color: color || 'var(--forge-text-secondary)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  const dotsStyle = {
    flex: 1,
    borderBottom: '1px dotted var(--forge-border-active)',
    margin: '0 8px',
    alignSelf: 'flex-end',
    minWidth: '16px',
  };

  const valueStyle = (color) => ({
    fontFamily: "'JetBrains Mono', var(--forge-font-tech)",
    fontSize: '13px',
    fontWeight: 500,
    color: color || 'var(--forge-text-primary)',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    flexShrink: 0,
  });

  const subtotalSectionStyle = {
    borderTop: '1px solid var(--forge-border-active)',
    marginTop: '12px',
    paddingTop: '12px',
  };

  const totalSectionStyle = {
    borderTop: '2px solid var(--forge-accent-primary)',
    marginTop: '16px',
    paddingTop: '16px',
  };

  const totalLabelStyle = {
    fontFamily: 'var(--forge-font-heading)',
    fontSize: '14px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--forge-text-primary)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const totalValueStyle = {
    fontFamily: "'JetBrains Mono', var(--forge-font-tech)",
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    flexShrink: 0,
  };

  const perUnitStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '12px',
    fontWeight: 400,
    color: 'var(--forge-text-muted)',
    textAlign: 'right',
    marginTop: '4px',
  };

  const renderLineItem = (item, color = null, key) => (
    <div key={key} style={lineItemStyle()}>
      <span style={labelStyle(color)}>{item.label}</span>
      <span style={dotsStyle} />
      <span style={valueStyle(color)}>{item.value}</span>
    </div>
  );

  return (
    <div className={className} style={wrapperStyle}>
      {/* Header */}
      <div style={headerStyle}>COST ANALYSIS</div>

      {/* Line items */}
      {items.map((item, i) => renderLineItem(item, null, `item-${i}`))}

      {/* Subtotal */}
      {subtotal && (
        <div style={subtotalSectionStyle}>
          <div style={lineItemStyle()}>
            <span style={labelStyle(null)}>{subtotal.label || 'Subtotal'}</span>
            <span style={dotsStyle} />
            <span style={valueStyle(null)}>{subtotal.value}</span>
          </div>
        </div>
      )}

      {/* Discount */}
      {discount && (
        <div style={lineItemStyle()}>
          <span style={labelStyle('var(--forge-success)')}>{discount.label}</span>
          <span style={dotsStyle} />
          <span style={valueStyle('var(--forge-success)')}>{discount.value}</span>
        </div>
      )}

      {/* Tax */}
      {tax && (
        <div style={lineItemStyle()}>
          <span style={labelStyle('var(--forge-text-muted)')}>{tax.label}</span>
          <span style={dotsStyle} />
          <span style={valueStyle('var(--forge-text-muted)')}>{tax.value}</span>
        </div>
      )}

      {/* Total */}
      {total && (
        <div style={totalSectionStyle}>
          <div style={lineItemStyle()}>
            <span style={totalLabelStyle}>{total.label || 'TOTAL'}</span>
            <span style={dotsStyle} />
            <span style={totalValueStyle}>{total.value}</span>
          </div>
          {perUnit && <div style={perUnitStyle}>{perUnit}</div>}
        </div>
      )}
    </div>
  );
}
