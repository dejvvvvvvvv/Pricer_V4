import React, { useEffect, useCallback, useRef, useState } from 'react';
import Icon from '../../../../components/AppIcon';
import TabCustomer from './TabCustomer';
import TabShipping from './TabShipping';
import TabItemsFiles from './TabItemsFiles';
import StorageStatusBadge from './StorageStatusBadge';
import { getStatusLabel } from '../../../../utils/adminOrdersStorage';

const TABS = [
  { id: 'customer', label: 'Customer', icon: 'User' },
  { id: 'shipping', label: 'Shipping', icon: 'MapPin' },
  { id: 'items', label: 'Items + Files', icon: 'Package' },
];

export default function OrderDetailModal({ open, order, onClose, onSaveNote, onUpdateOrders }) {
  const overlayRef = useRef(null);
  const bodyRef = useRef(null);
  const [activeTab, setActiveTab] = useState('customer');

  // Reset tab when order changes
  useEffect(() => {
    if (open) setActiveTab('customer');
  }, [open, order?.id]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // Smooth scroll containment (same pattern as ForgeDialog)
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    let targetY = 0;
    let rafId = null;

    const animate = () => {
      const body = bodyRef.current;
      if (!body) { rafId = null; return; }
      const diff = targetY - body.scrollTop;
      if (Math.abs(diff) < 0.5) {
        body.scrollTop = targetY;
        rafId = null;
        return;
      }
      body.scrollTop += diff * 0.18;
      rafId = requestAnimationFrame(animate);
    };

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const body = bodyRef.current;
      if (!body) return;
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 40;
      if (e.deltaMode === 2) delta *= body.clientHeight;
      if (rafId === null) targetY = body.scrollTop;
      const maxScroll = body.scrollHeight - body.clientHeight;
      targetY = Math.max(0, Math.min(maxScroll, targetY + delta));
      if (!rafId) rafId = requestAnimationFrame(animate);
    };

    overlay.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      overlay.removeEventListener('wheel', handleWheel);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [open]);

  if (!open || !order) return null;

  const storageStatus = order?.storage?.status || 'pending';

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(8,9,12,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.id}`}
    >
      <div style={{
        backgroundColor: 'var(--forge-bg-surface)',
        border: '1px solid var(--forge-border-default)',
        borderRadius: '12px',
        boxShadow: 'var(--forge-shadow-lg)',
        width: '70%',
        minWidth: '600px',
        maxWidth: '1100px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--forge-border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{
              fontFamily: 'var(--forge-font-heading)',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--forge-text-primary)',
              margin: 0,
            }}>
              {order.id}
            </h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: 'rgba(0, 212, 170, 0.1)',
              color: 'var(--forge-accent-primary)',
              border: '1px solid rgba(0, 212, 170, 0.25)',
            }}>
              {getStatusLabel(order.status, 'en')}
            </span>
            <StorageStatusBadge status={storageStatus} compact />
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 'var(--forge-radius-sm)',
              color: 'var(--forge-text-muted)',
              cursor: 'pointer',
              transition: 'color 120ms ease-out, background-color 120ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--forge-text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--forge-bg-overlay)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--forge-text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid var(--forge-border-default)',
          flexShrink: 0,
          padding: '0 24px',
        }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'var(--forge-font-body)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                color: activeTab === tab.id ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--forge-accent-primary)' : '2px solid transparent',
                transition: 'all 120ms ease',
                marginBottom: '-1px',
              }}
            >
              <Icon name={tab.icon} size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          style={{
            padding: '24px',
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {activeTab === 'customer' && (
            <TabCustomer order={order} onSaveNote={onSaveNote} onUpdateOrders={onUpdateOrders} />
          )}
          {activeTab === 'shipping' && (
            <TabShipping order={order} />
          )}
          {activeTab === 'items' && (
            <TabItemsFiles order={order} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
