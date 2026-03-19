/**
 * WidgetPublicPage — verejna embeddable kalkulacka
 *
 * Route: /w/:publicWidgetId
 *
 * Placeholder: widget-kalkulacka neni v tomto buildu pritomna.
 * Az bude widget-kalkulacka implementovana, tento soubor lze nahradit
 * re-exportem: export { default } from '../widget-kalkulacka';
 */
import React from 'react';
import { useParams } from 'react-router-dom';

export default function WidgetPublicPage() {
  const { publicWidgetId } = useParams();

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--forge-bg-void, #08090C)',
        color: 'var(--forge-text-primary, #E8ECF1)',
        fontFamily: 'var(--forge-font-body, sans-serif)',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <p style={{ margin: 0, fontSize: '14px', opacity: 0.5 }}>
        Widget ID: {publicWidgetId}
      </p>
      <p style={{ margin: 0, fontSize: '12px', opacity: 0.35 }}>
        Widget kalkulacka bude dostupna po implementaci.
      </p>
    </div>
  );
}
