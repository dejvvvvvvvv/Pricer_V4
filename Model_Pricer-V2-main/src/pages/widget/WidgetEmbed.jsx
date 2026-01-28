import React, { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Render } from '@measured/puck';
import '@measured/puck/puck.css';

import {
  getWidgetByIdOrPublicId,
  getWidgetBuilderData,
} from '../../utils/adminBrandingWidgetStorage';

import { createWidgetBuilderConfig } from '../../widgets/puck/widgetBuilderConfig';

// Demo tenant (Varianta A). TODO: unify tenant resolution across Admin + runtime.
const TENANT_ID = 'test-customer-1';

/**
 * Iframe-friendly runtime route.
 *
 * URL: /widget/embed/:publicId
 *
 * - No Header/Footer (handled in Routes.jsx via isWidgetStandalone)
 * - Posts its height to parent via postMessage so parent can auto-resize iframe.
 */
export default function WidgetEmbed() {
  const { publicId } = useParams();
  const rootRef = useRef(null);

  const widget = useMemo(() => getWidgetByIdOrPublicId(TENANT_ID, publicId), [publicId]);
  const data = useMemo(() => getWidgetBuilderData(TENANT_ID, publicId), [publicId]);
  const config = useMemo(() => createWidgetBuilderConfig('preview'), []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const postHeight = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      try {
        window.parent?.postMessage(
          { type: 'MODELPRICER_WIDGET_HEIGHT', publicId, height: h },
          '*'
        );
      } catch {
        // ignore
      }
    };

    postHeight();

    const ro = new ResizeObserver(() => postHeight());
    ro.observe(el);

    return () => {
      try {
        ro.disconnect();
      } catch {
        // ignore
      }
    };
  }, [publicId]);

  if (!publicId) {
    return (
      <div style={{ padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
        <div style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 12 }}>
          Chybí publicId v URL.
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div style={{ padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
        <div style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 12 }}>
          Widget nenalezen: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{publicId}</span>
        </div>
      </div>
    );
  }

  const maxWidth = widget.widthMode === 'fixed' && widget.widthPx
    ? Math.min(1400, Math.max(320, Number(widget.widthPx) || 800))
    : 1100;

  return (
    <div ref={rootRef} style={{ background: 'transparent', padding: 12 }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <Render config={config} data={data} />
      </div>
    </div>
  );
}
