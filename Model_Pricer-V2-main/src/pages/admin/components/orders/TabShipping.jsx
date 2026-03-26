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

  const shippingSnap = order?.shipping_snapshot;
  const expressSnap = order?.express_snapshot;
  const billingAddr = order?.billing_address;
  const showBilling = billingAddr && !order?.billing_address_same_as_shipping && (billingAddr.street || billingAddr.city);

  const SHIPPING_TYPE_LABELS = {
    FIXED: 'Pevna cena',
    PICKUP: 'Osobni odber',
    WEIGHT_BASED: 'Podle vahy',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Shipping method info */}
      {shippingSnap && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--forge-bg-elevated)',
          borderRadius: 'var(--forge-radius-lg)',
          border: '1px solid var(--forge-border-default)',
        }}>
          <h4 style={{
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '12px',
            margin: '0 0 12px 0',
          }}>Dopravni metoda</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {shippingSnap.name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase' }}>Nazev</span>
                <span style={{ fontSize: '14px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-primary)', fontWeight: 600 }}>{shippingSnap.name}</span>
              </div>
            )}
            {shippingSnap.type && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase' }}>Typ</span>
                <span style={{ fontSize: '13px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-primary)' }}>{SHIPPING_TYPE_LABELS[shippingSnap.type] || shippingSnap.type}</span>
              </div>
            )}
            {(shippingSnap.delivery_days_min || shippingSnap.delivery_days_max) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase' }}>Doba doruceni</span>
                <span style={{ fontSize: '13px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-primary)' }}>
                  {shippingSnap.delivery_days_min && shippingSnap.delivery_days_max
                    ? `${shippingSnap.delivery_days_min}–${shippingSnap.delivery_days_max} dni`
                    : `${shippingSnap.delivery_days_min || shippingSnap.delivery_days_max} dni`}
                </span>
              </div>
            )}
            {shippingSnap.cost != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase' }}>Cena dopravy</span>
                <span style={{ fontSize: '14px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-primary)', fontWeight: 700 }}>{Number(shippingSnap.cost).toFixed(2)} Kc</span>
              </div>
            )}
            {shippingSnap.free_shipping_applied && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '999px',
                fontSize: '11px', fontFamily: 'var(--forge-font-tech)', fontWeight: 700,
                backgroundColor: 'rgba(0,212,170,0.12)', color: 'var(--forge-success)',
                border: '1px solid rgba(0,212,170,0.25)', alignSelf: 'flex-start',
              }}>
                <Icon name="Check" size={12} /> Doprava zdarma
              </div>
            )}
          </div>
        </div>
      )}

      {/* Express tier info */}
      {expressSnap && (expressSnap.tier_id || expressSnap.name || expressSnap.tier) && (
        <div style={{
          padding: '16px 20px',
          background: 'var(--forge-bg-elevated)',
          borderRadius: 'var(--forge-radius-lg)',
          border: '1px solid var(--forge-border-default)',
        }}>
          <h4 style={{
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '12px',
            margin: '0 0 12px 0',
          }}>Express výroba</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(expressSnap.name || expressSnap.tier) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase' }}>Tier</span>
                <span style={{ fontSize: '14px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-primary)', fontWeight: 600 }}>{expressSnap.name || expressSnap.tier}</span>
              </div>
            )}
            {expressSnap.tier_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase' }}>ID</span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-secondary)' }}>{expressSnap.tier_id}</span>
              </div>
            )}
            {(expressSnap.surcharge_total != null && Number(expressSnap.surcharge_total) > 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase' }}>Prirazka</span>
                <span style={{ fontSize: '14px', fontFamily: 'var(--forge-font-tech)', color: '#FF6B35', fontWeight: 700 }}>{Number(expressSnap.surcharge_total).toFixed(2)} Kc</span>
              </div>
            )}
          </div>
        </div>
      )}

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
          color: 'var(--forge-bg-void)',
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
            <div style={{ fontSize: '12px', marginTop: '6px', color: 'var(--forge-text-muted)' }}>
              Tel: {order.customer_snapshot.phone}
            </div>
          )}
        </div>
      </div>

      {/* Billing address (if different from shipping) */}
      {showBilling && (
        <div>
          <h4 style={{
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>Fakturacni adresa</h4>

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
              {billingAddr.street && <div>{billingAddr.street}</div>}
              <div>{billingAddr.city}{billingAddr.zip ? `, ${billingAddr.zip}` : ''}</div>
              {billingAddr.country && <div>{COUNTRY_NAMES[billingAddr.country] || billingAddr.country}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
