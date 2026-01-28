import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Render } from '@measured/puck';
import '@measured/puck/puck.css';

import {
  getBranding,
  getWidgetByIdOrPublicId,
  getWidgetBuilderData,
} from '../../utils/adminBrandingWidgetStorage';

import { createWidgetBuilderConfig } from '../../widgets/puck/widgetBuilderConfig';

// Demo tenant handling (Varianta A): later replace with real tenant resolution (shopID, token, hostname...)
const TENANT_ID = 'test-customer-1';

export default function WidgetPreview() {
  const { publicId } = useParams();

  const branding = useMemo(() => getBranding(TENANT_ID), []);
  const widget = useMemo(() => getWidgetByIdOrPublicId(TENANT_ID, publicId), [publicId]);
  const data = useMemo(() => {
    if (!publicId) return null;
    return getWidgetBuilderData(TENANT_ID, publicId);
  }, [publicId]);

  const config = useMemo(() => createWidgetBuilderConfig('preview'), []);

  if (!publicId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-lg font-semibold text-gray-900">Widget preview</div>
          <div className="mt-2 text-sm text-gray-600">Chybí publicId v URL.</div>
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
          <div className="text-lg font-semibold text-gray-900">Widget nenalezen</div>
          <div className="mt-2 text-sm text-gray-600">
            Nenalezen widget pro <span className="font-mono">{publicId}</span> (tenant: {TENANT_ID}).
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Tip: Otevři Admin → Widget → vyber widget a klikni Preview.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Widget Preview</div>
            <div className="text-xl font-semibold text-gray-900">
              {widget.name} <span className="text-gray-400">({widget.publicId})</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Branding: <span className="font-medium text-gray-700">{branding?.businessName || '—'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Render config={config} data={data} />
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Toto je preview (Varianta A). V další fázi bude embed /widget/embed/:publicId pro vložení na cizí web.
        </div>
      </div>
    </div>
  );
}
