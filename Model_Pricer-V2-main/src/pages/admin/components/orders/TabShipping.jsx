import React from 'react';
import Icon from '../../../../components/AppIcon';

const COUNTRY_NAMES = {
  CZ: 'Ceska republika',
  SK: 'Slovensko',
  DE: 'Nemecko',
  AT: 'Rakousko',
  PL: 'Polsko',
};

export default function TabShipping({ order }) {
  const addr = order?.shipping_address;

  if (!addr || (!addr.street && !addr.city)) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: 'var(--forge-text-muted)',
        fontFamily: 'var(--forge-font-body)',
        fontSize: '14px',
      }}>
        <Icon name="MapPin" size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
        <p>No shipping address provided</p>
      </div>
    );
  }

  const countryName = COUNTRY_NAMES[addr.country] || addr.country || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Address card */}
      <div style={{
        padding: '20px',
        background: 'var(--forge-bg-elevated)',
        borderRadius: 'var(--forge-radius-lg)',
        border: '1px solid var(--forge-border-default)',
      }}>
        <div style={{
          fontSize: '15px',
          fontFamily: 'var(--forge-font-body)',
          color: 'var(--forge-text-primary)',
          lineHeight: 1.7,
        }}>
          <div>{addr.street}</div>
          <div>{addr.city}{addr.zip ? `, ${addr.zip}` : ''}</div>
          <div>{countryName}</div>
        </div>
      </div>

      {/* Formatted shipping label */}
      <div>
        <h4 style={{
          fontSize: '12px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
        }}>Shipping Label Preview</h4>

        <div style={{
          padding: '20px 24px',
          background: '#fff',
          borderRadius: 'var(--forge-radius-md)',
          border: '2px dashed var(--forge-border-default)',
          fontFamily: 'var(--forge-font-body)',
          color: '#08090C',
          lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, fontSize: '14px' }}>
            {order?.customer_snapshot?.name || 'Customer'}
          </div>
          {order?.customer_snapshot?.company && (
            <div style={{ fontSize: '13px' }}>{order.customer_snapshot.company}</div>
          )}
          <div style={{ fontSize: '13px', marginTop: '4px' }}>{addr.street}</div>
          <div style={{ fontSize: '13px' }}>{addr.zip} {addr.city}</div>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>{countryName}</div>
          {order?.customer_snapshot?.phone && (
            <div style={{ fontSize: '12px', marginTop: '6px', color: '#666' }}>
              Tel: {order.customer_snapshot.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
