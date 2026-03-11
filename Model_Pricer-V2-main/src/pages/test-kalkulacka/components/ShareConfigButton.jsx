import React, { useState, useCallback, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { generateQRDataURL } from '../../../lib/qrCode';

/* ── Forge-consistent styles ──────────────────────────────────────────────── */

const styles = {
  shareBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
    background: 'var(--forge-bg-elevated, #14161B)',
    color: 'var(--forge-text-secondary, #B0B7C3)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    outline: 'none',
  },
  shareBtnHover: {
    borderColor: 'var(--forge-accent-primary, #00D4AA)',
    color: 'var(--forge-text-primary, #E8ECF1)',
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
    animation: 'shareToastIn 0.2s ease-out',
    boxShadow: '0 4px 12px rgba(0, 212, 170, 0.3)',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9998,
    animation: 'shareOverlayIn 0.15s ease-out',
  },
  modal: {
    background: 'var(--forge-bg-surface, #11131A)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
    borderRadius: 'var(--forge-radius-xl, 16px)',
    padding: '1.5rem',
    minWidth: '280px',
    maxWidth: '340px',
    position: 'relative',
    animation: 'shareModalIn 0.2s ease-out',
  },
  modalTitle: {
    fontSize: 'var(--forge-text-lg, 18px)',
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    color: 'var(--forge-text-primary, #E8ECF1)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  closeBtn: {
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    background: 'none',
    border: 'none',
    color: 'var(--forge-text-muted, #7A8291)',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s',
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  qrImage: {
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
  },
  downloadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--forge-radius-md, 8px)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
    background: 'var(--forge-bg-elevated, #14161B)',
    color: 'var(--forge-text-secondary, #B0B7C3)',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    fontWeight: 500,
    transition: 'all 0.15s ease',
  },
  urlPreview: {
    fontSize: '11px',
    fontFamily: 'var(--forge-font-mono, monospace)',
    color: 'var(--forge-text-muted, #7A8291)',
    wordBreak: 'break-all',
    padding: '0.5rem',
    background: 'var(--forge-bg-elevated, #14161B)',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    border: '1px solid var(--forge-border-default, #2A2D35)',
    maxHeight: '3rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};

// Inject keyframe animations once
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const css = `
    @keyframes shareToastIn {
      from { opacity: 0; transform: translateX(-50%) translateY(8px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
    @keyframes shareOverlayIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes shareModalIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Share configuration button with copy-to-clipboard and QR code popup.
 *
 * @param {Object} props
 * @param {() => string} props.getShareableUrl - Returns the full shareable URL.
 * @param {boolean} [props.compact=false] - Compact mode (icon only on mobile).
 */
export default function ShareConfigButton({ getShareableUrl, compact = false }) {
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [shareUrl, setShareUrl] = useState('');
  const { copied, copyToClipboard } = useCopyToClipboard({ resetDelay: 2500 });
  const modalRef = useRef(null);

  useEffect(() => {
    injectStyles();
  }, []);

  const handleCopy = useCallback(() => {
    const url = getShareableUrl();
    copyToClipboard(url);
  }, [getShareableUrl, copyToClipboard]);

  const handleShowQR = useCallback(() => {
    const url = getShareableUrl();
    setShareUrl(url);
    try {
      const dataUrl = generateQRDataURL(url, {
        scale: 6,
        margin: 3,
        foreground: '#E8ECF1',
        background: '#11131A',
      });
      setQrDataUrl(dataUrl);
      setShowQR(true);
    } catch (err) {
      // URL too long for QR — try without search params prefix
      console.warn('[ShareConfigButton] QR generation failed:', err);
    }
  }, [getShareableUrl]);

  const handleCloseQR = useCallback(() => {
    setShowQR(false);
    setQrDataUrl(null);
  }, []);

  const handleDownloadQR = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'kalkulacka-konfigurace-qr.png';
    a.click();
  }, [qrDataUrl]);

  // Close modal on Escape
  useEffect(() => {
    if (!showQR) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleCloseQR();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [showQR, handleCloseQR]);

  // Close modal on click outside
  const handleOverlayClick = useCallback((e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleCloseQR();
    }
  }, [handleCloseQR]);

  // Hover state
  const [hoverCopy, setHoverCopy] = useState(false);
  const [hoverQR, setHoverQR] = useState(false);
  const [hoverDownload, setHoverDownload] = useState(false);

  return (
    <>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        {/* Copy link button */}
        <button
          type="button"
          onClick={handleCopy}
          onMouseEnter={() => setHoverCopy(true)}
          onMouseLeave={() => setHoverCopy(false)}
          style={{
            ...styles.shareBtn,
            ...(hoverCopy || copied ? styles.shareBtnHover : {}),
            ...(copied ? { borderColor: 'var(--forge-success, #10B981)', color: 'var(--forge-success, #10B981)' } : {}),
          }}
          title="Sdílet konfiguraci"
          aria-label={copied ? 'Odkaz zkopírován' : 'Sdílet konfiguraci — zkopírovat odkaz'}
        >
          <Icon name={copied ? 'Check' : 'Link'} size={14} />
          {!compact && (
            <span>{copied ? 'Zkopírováno!' : 'Sdílet'}</span>
          )}
        </button>

        {/* QR code button */}
        <button
          type="button"
          onClick={handleShowQR}
          onMouseEnter={() => setHoverQR(true)}
          onMouseLeave={() => setHoverQR(false)}
          style={{
            ...styles.shareBtn,
            ...(hoverQR ? styles.shareBtnHover : {}),
            padding: '0.375rem 0.5rem',
          }}
          title="QR kód"
          aria-label="Zobrazit QR kód konfigurace"
        >
          <Icon name="QrCode" size={14} />
        </button>
      </div>

      {/* Toast notification */}
      {copied && (
        <div style={styles.toast} role="status" aria-live="polite">
          Odkaz zkopírován!
        </div>
      )}

      {/* QR Code modal */}
      {showQR && qrDataUrl && (
        <div
          style={styles.overlay}
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
          aria-label="QR kód konfigurace"
        >
          <div style={styles.modal} ref={modalRef}>
            <button
              type="button"
              onClick={handleCloseQR}
              style={styles.closeBtn}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
              aria-label="Zavřít"
            >
              <Icon name="X" size={18} />
            </button>

            <div style={styles.modalTitle}>
              <Icon name="QrCode" size={20} style={{ color: 'var(--forge-accent-primary)' }} />
              QR kód
            </div>

            <div style={styles.qrContainer}>
              <img
                src={qrDataUrl}
                alt="QR kód s konfigurací kalkulačky"
                width={200}
                height={200}
                style={styles.qrImage}
              />

              <div style={{ ...styles.urlPreview, width: '100%' }}>
                {shareUrl}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  onMouseEnter={() => setHoverDownload(true)}
                  onMouseLeave={() => setHoverDownload(false)}
                  style={{
                    ...styles.downloadBtn,
                    flex: 1,
                    justifyContent: 'center',
                    ...(hoverDownload ? styles.shareBtnHover : {}),
                  }}
                  aria-label="Stáhnout QR kód jako PNG"
                >
                  <Icon name="Download" size={14} />
                  Stáhnout PNG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(shareUrl);
                  }}
                  style={{
                    ...styles.downloadBtn,
                    flex: 1,
                    justifyContent: 'center',
                    ...(copied ? { borderColor: 'var(--forge-success, #10B981)', color: 'var(--forge-success, #10B981)' } : {}),
                  }}
                  aria-label="Zkopírovat odkaz"
                >
                  <Icon name={copied ? 'Check' : 'Copy'} size={14} />
                  {copied ? 'Zkopírováno!' : 'Zkopírovat'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
