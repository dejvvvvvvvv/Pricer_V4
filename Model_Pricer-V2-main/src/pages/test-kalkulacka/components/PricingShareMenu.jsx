import React, { useState, useCallback, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

/* ── Print CSS ──────────────────────────────────────────────────────────── */

let printStylesInjected = false;
function injectPrintStyles() {
  if (printStylesInjected || typeof document === 'undefined') return;
  printStylesInjected = true;

  const css = `
    @media print {
      /* Hide all UI controls */
      [data-no-print],
      .tk-sticky-bottom,
      .tk-floating-shortcuts-btn,
      .tk-generate-area,
      .tk-bottom-nav,
      .tk-stepper,
      .tk-breadcrumb-nav,
      nav,
      header,
      footer,
      .tk-model-viewer,
      .tk-model-viewer-empty,
      .tk-upload-zone,
      .tk-pricing-actions,
      .tk-pricing-chart,
      .tk-shortcuts-overlay,
      .pricing-share-menu-dropdown,
      button[data-no-print] {
        display: none !important;
      }

      /* Reset backgrounds for print */
      body {
        background: #fff !important;
        color: #000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Print header branding */
      .print-header {
        display: flex !important;
        flex-direction: column;
        align-items: center;
        padding: 1.5rem 0 1rem;
        border-bottom: 2px solid #333;
        margin-bottom: 1.5rem;
      }

      .print-header h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #000;
        margin: 0;
      }

      .print-header p {
        font-size: 0.75rem;
        color: #666;
        margin: 0.25rem 0 0;
      }

      /* Make pricing card visible and styled */
      .tk-print-summary {
        display: block !important;
        page-break-inside: avoid;
      }

      /* Override dark theme colors for print */
      [style*="--forge-bg"],
      [style*="--forge-text"],
      [style*="var(--forge"] {
        color: #000 !important;
        background: transparent !important;
        border-color: #ccc !important;
      }

      /* Ensure pricing summary card is visible */
      [role="region"][aria-label="Cena a souhrn objednavky"] {
        border: 1px solid #ccc !important;
        background: #fff !important;
        border-radius: 8px !important;
        padding: 1rem !important;
        box-shadow: none !important;
      }

      /* Model cards for print */
      .print-model-list {
        display: block !important;
      }

      /* Print footer */
      .print-footer {
        display: block !important;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #ccc;
        font-size: 0.75rem;
        color: #666;
        text-align: center;
      }

      /* Page settings */
      @page {
        margin: 1.5cm;
        size: A4;
      }
    }

    /* Hidden by default, shown only in print */
    .print-header,
    .print-footer,
    .print-model-list {
      display: none;
    }

    /* Dropdown animation */
    @keyframes pricingShareDropIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  const style = document.createElement('style');
  style.id = 'pricing-share-print-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

/* ── Forge-consistent styles ──────────────────────────────────────────── */

const styles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
  },
  triggerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
    background: 'var(--forge-bg-elevated, #14161B)',
    color: 'var(--forge-text-secondary, #B0B7C3)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    outline: 'none',
  },
  triggerBtnHover: {
    borderColor: 'var(--forge-accent-primary, #00D4AA)',
    color: 'var(--forge-text-primary, #E8ECF1)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    minWidth: '220px',
    background: 'var(--forge-bg-surface, #11131A)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
    borderRadius: 'var(--forge-radius-lg, 12px)',
    padding: '0.375rem',
    zIndex: 100,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    animation: 'pricingShareDropIn 0.15s ease-out',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    width: '100%',
    padding: '0.5rem 0.625rem',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: 'none',
    background: 'transparent',
    color: 'var(--forge-text-secondary, #B0B7C3)',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    transition: 'all 0.12s ease',
    textAlign: 'left',
    outline: 'none',
  },
  menuItemHover: {
    background: 'var(--forge-bg-elevated, #14161B)',
    color: 'var(--forge-text-primary, #E8ECF1)',
  },
  menuItemIcon: {
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'var(--forge-text-muted, #7A8291)',
  },
  separator: {
    height: '1px',
    background: 'var(--forge-border-default, #2A2D35)',
    margin: '0.25rem 0.5rem',
  },
  toast: {
    position: 'fixed',
    bottom: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--forge-radius-md, 8px)',
    background: 'var(--forge-accent-primary, #00D4AA)',
    color: 'var(--forge-bg-void, #08090C)',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 600,
    zIndex: 9999,
    pointerEvents: 'none',
    animation: 'pricingShareDropIn 0.2s ease-out',
    boxShadow: '0 4px 12px rgba(0, 212, 170, 0.3)',
  },
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatCzkSimple(amount) {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} Kc`;
  }
}

function buildPriceSummaryText(quote, uploadedFiles, printConfigs) {
  if (!quote) return '';

  const lines = [];
  lines.push('=== Cenova kalkulace 3D tisku ===');
  lines.push(`Datum: ${new Date().toLocaleDateString('cs-CZ')}`);
  lines.push('');

  // Configuration from first model
  const firstModel = quote.models?.[0];
  if (firstModel) {
    const cfg = printConfigs?.[firstModel.id] || {};
    lines.push(`Material: ${(cfg.material || firstModel.base?.materialKey || '-').toUpperCase()}`);
    lines.push(`Kvalita: ${cfg.quality || '-'}`);
    lines.push(`Vyplneni: ${cfg.infill ?? '-'}%`);
  }

  lines.push(`Pocet modelu: ${quote.models?.length || 0}`);
  lines.push('');

  // Model list
  if (quote.models?.length > 0) {
    lines.push('--- Modely ---');
    for (const m of quote.models) {
      const qty = m.quantity > 1 ? ` (${m.quantity}x)` : '';
      lines.push(`${m.name}${qty}: ${formatCzkSimple(m.totals?.subtotalAfterPerModelRounding)}`);
    }
    lines.push('');
  }

  // Totals
  const displayTotal = Number.isFinite(quote.simple?.grandTotal) ? quote.simple.grandTotal : quote.total;
  lines.push(`CELKEM: ${formatCzkSimple(displayTotal)}`);

  return lines.join('\n');
}

function buildEmailSummary(quote, printConfigs) {
  if (!quote) return { subject: '', body: '' };

  const firstModel = quote.models?.[0];
  const cfg = firstModel ? (printConfigs?.[firstModel.id] || {}) : {};
  const displayTotal = Number.isFinite(quote.simple?.grandTotal) ? quote.simple.grandTotal : quote.total;

  const subject = `Cenova kalkulace 3D tisku - ${formatCzkSimple(displayTotal)}`;

  const bodyLines = [
    'Cenova kalkulace 3D tisku',
    '',
    `Material: ${(cfg.material || '').toUpperCase()}`,
    `Kvalita: ${cfg.quality || '-'}`,
    `Pocet modelu: ${quote.models?.length || 0}`,
    '',
    `Celkova cena: ${formatCzkSimple(displayTotal)}`,
    '',
    `Vygenerovano: ${new Date().toLocaleDateString('cs-CZ')} v ${new Date().toLocaleTimeString('cs-CZ')}`,
  ];

  return {
    subject: encodeURIComponent(subject),
    body: encodeURIComponent(bodyLines.join('\n')),
  };
}

/* ── Component ──────────────────────────────────────────────────────────── */

/**
 * Dropdown share/export menu for pricing results.
 *
 * Features:
 * - Copy shareable link (reuses ShareConfigButton logic via getShareableUrl)
 * - Print / PDF via window.print() with @media print CSS
 * - Email summary via mailto: link
 * - Copy price summary text to clipboard
 *
 * @param {Object} props
 * @param {() => string} props.getShareableUrl - Returns the shareable URL for current config.
 * @param {Object|null} props.quote - Current pricing quote from pricingEngineV3.
 * @param {Array} props.uploadedFiles - Array of uploaded file objects.
 * @param {Object} props.printConfigs - Per-model print configuration map.
 * @param {boolean} [props.compact=false] - Compact mode for mobile.
 */
export default function PricingShareMenu({
  getShareableUrl,
  quote,
  uploadedFiles,
  printConfigs,
  compact = false,
}) {
  const [open, setOpen] = useState(false);
  const [hoverTrigger, setHoverTrigger] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const wrapperRef = useRef(null);
  const { copied, copyToClipboard } = useCopyToClipboard({ resetDelay: 2500 });

  useEffect(() => {
    injectPrintStyles();
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  }, []);

  const handleCopyLink = useCallback(() => {
    if (!getShareableUrl) return;
    const url = getShareableUrl();
    copyToClipboard(url);
    showToast('Odkaz zkopirovan');
    setOpen(false);
  }, [getShareableUrl, copyToClipboard, showToast]);

  const handlePrint = useCallback(() => {
    setOpen(false);
    // Small delay so dropdown closes before print dialog opens
    requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  const handleEmailSummary = useCallback(() => {
    if (!quote) return;
    const { subject, body } = buildEmailSummary(quote, printConfigs);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
    setOpen(false);
  }, [quote, printConfigs]);

  const handleCopySummary = useCallback(() => {
    if (!quote) return;
    const text = buildPriceSummaryText(quote, uploadedFiles, printConfigs);
    copyToClipboard(text);
    showToast('Souhrn zkopirovan do schranky');
    setOpen(false);
  }, [quote, uploadedFiles, printConfigs, copyToClipboard, showToast]);

  const menuItems = [
    {
      id: 'copy-link',
      icon: 'Link',
      label: 'Zkopirovat odkaz',
      onClick: handleCopyLink,
      disabled: !getShareableUrl,
    },
    { id: 'sep-1', separator: true },
    {
      id: 'print',
      icon: 'Printer',
      label: 'Tisknout / PDF',
      onClick: handlePrint,
      disabled: !quote,
    },
    {
      id: 'email',
      icon: 'Mail',
      label: 'Odeslat emailem',
      onClick: handleEmailSummary,
      disabled: !quote,
    },
    { id: 'sep-2', separator: true },
    {
      id: 'copy-summary',
      icon: 'ClipboardCopy',
      label: 'Zkopirovat souhrn ceny',
      onClick: handleCopySummary,
      disabled: !quote,
    },
  ];

  return (
    <>
      <div ref={wrapperRef} style={styles.wrapper} data-no-print>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          onMouseEnter={() => setHoverTrigger(true)}
          onMouseLeave={() => setHoverTrigger(false)}
          style={{
            ...styles.triggerBtn,
            ...(hoverTrigger || open ? styles.triggerBtnHover : {}),
          }}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="Sdilet a exportovat cenovou kalkulaci"
          title="Sdilet / Exportovat"
        >
          <Icon name="Share2" size={14} />
          {!compact && <span>Sdilet</span>}
          <Icon
            name="ChevronDown"
            size={12}
            style={{
              transition: 'transform 0.15s ease',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              marginLeft: compact ? 0 : '-0.125rem',
            }}
          />
        </button>

        {open && (
          <div
            className="pricing-share-menu-dropdown"
            style={styles.dropdown}
            role="menu"
            aria-label="Moznosti sdileni a exportu"
          >
            {menuItems.map((item) => {
              if (item.separator) {
                return <div key={item.id} style={styles.separator} role="separator" />;
              }

              const isHovered = hoveredItem === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={item.onClick}
                  disabled={item.disabled}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onFocus={() => setHoveredItem(item.id)}
                  onBlur={() => setHoveredItem(null)}
                  style={{
                    ...styles.menuItem,
                    ...(isHovered && !item.disabled ? styles.menuItemHover : {}),
                    ...(item.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                  }}
                >
                  <span style={styles.menuItemIcon}>
                    <Icon name={item.icon} size={15} />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toastMsg && (
        <div style={styles.toast} role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
    </>
  );
}
