/**
 * AdminSettings — Admin panel preferences & data management.
 *
 * Sections:
 * 1. General (currency, language, timezone, date/number format)
 * 2. Orders (auto-numbering, prefix, default status, auto-archive)
 * 3. Notifications (email, sound, desktop)
 * 4. Display (default view, items per page, date display, compact mode)
 * 5. Data Management (clear orders, reset pricing, factory reset, backup link)
 *
 * Storage: settings:v1 via adminSettingsStorage helpers.
 */

import React, { useState, useCallback, useEffect } from 'react';
import ForgePageHeader from '../../components/ui/forge/ForgePageHeader';
import ForgeSelect from '../../components/ui/forge/ForgeSelect';
import ForgeInput from '../../components/ui/forge/ForgeInput';
import ForgeToggle from '../../components/ui/forge/ForgeToggle';
import { ForgeConfirmDialog, useConfirmDialog } from '../../components/ui/forge/ForgeConfirmDialog';
import Icon from '../../components/AppIcon';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  loadSettings,
  saveSettings,
  resetSettings,
  getDefaultSettings,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  DECIMAL_SEPARATOR_OPTIONS,
  ORDER_STATUS_OPTIONS,
  ITEMS_PER_PAGE_OPTIONS,
  DATE_DISPLAY_OPTIONS,
  DEFAULT_VIEW_OPTIONS,
} from '../../utils/adminSettingsStorage';
import { writeTenantJson, readTenantJson, deleteTenantJson, clearAllTenantData } from '../../utils/adminTenantStorage';

// ---------------------------------------------------------------------------
// Styles (inline, consistent with other admin pages)
// ---------------------------------------------------------------------------

const cardStyle = {
  backgroundColor: 'var(--forge-bg-card, #0E1116)',
  border: '1px solid var(--forge-border-default, #1E2128)',
  borderRadius: 'var(--forge-radius-lg, 12px)',
  padding: '24px',
  marginBottom: '20px',
};

const cardTitleStyle = {
  fontFamily: 'var(--forge-font-heading, "Space Grotesk", sans-serif)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--forge-text-primary, #E8ECF1)',
  marginBottom: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: '16px',
};

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 0',
  borderBottom: '1px solid var(--forge-border-default, #1E2128)',
};

const rowLabelStyle = {
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  fontSize: '14px',
  color: 'var(--forge-text-primary, #E8ECF1)',
};

const rowDescStyle = {
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  fontSize: '12px',
  color: 'var(--forge-text-muted, #7A8291)',
  marginTop: '2px',
};

const dangerBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: 'var(--forge-radius-sm, 6px)',
  border: '1px solid var(--forge-error, #EF4444)',
  backgroundColor: 'transparent',
  color: 'var(--forge-error, #EF4444)',
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 150ms, color 150ms',
};

const linkBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: 'var(--forge-radius-sm, 6px)',
  border: '1px solid var(--forge-border-default, #1E2128)',
  backgroundColor: 'var(--forge-bg-elevated, #161A1F)',
  color: 'var(--forge-text-primary, #E8ECF1)',
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'border-color 150ms',
};

const saveBtnStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 24px',
  borderRadius: 'var(--forge-radius-sm, 6px)',
  border: 'none',
  backgroundColor: 'var(--forge-accent-primary, #00D4AA)',
  color: '#000',
  fontFamily: 'var(--forge-font-heading, "Space Grotesk", sans-serif)',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 150ms',
};

const toastStyle = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  padding: '12px 20px',
  borderRadius: 'var(--forge-radius-sm, 6px)',
  backgroundColor: 'var(--forge-accent-primary, #00D4AA)',
  color: '#000',
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  fontSize: '13px',
  fontWeight: 600,
  zIndex: 9999,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const errorToastStyle = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  padding: '12px 20px',
  borderRadius: 'var(--forge-radius-sm, 6px)',
  backgroundColor: 'var(--forge-error, #EF4444)',
  color: '#fff',
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  fontSize: '13px',
  fontWeight: 600,
  zIndex: 9999,
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSettings() {
  useDocumentTitle('Nastaveni | Admin');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [settings, setSettings] = useState(() => loadSettings());
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Timer ref for saved toast cleanup
  const savedTimerRef = React.useRef(null);
  React.useEffect(() => {
    return () => clearTimeout(savedTimerRef.current);
  }, []);

  // Confirm dialogs
  const clearOrdersDialog = useConfirmDialog();
  const resetPricingDialog = useConfirmDialog();
  const factoryResetDialog = useConfirmDialog();

  // Track changes
  const update = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  // Save
  const handleSave = useCallback(() => {
    setSaveError(null);
    try {
      saveSettings(settings);
      setDirty(false);
      setSaved(true);
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e?.message || (typeof e === 'string' ? e : 'Nepodarilo se ulozit nastaveni.'));
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveError(null), 4000);
    }
  }, [settings]);

  // Desktop notification permission
  const requestDesktopPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      update('desktopNotifications', true);
    }
  }, [update]);

  // Data management actions
  const handleClearOrders = useCallback(() => {
    writeTenantJson('orders:v1', []);
    writeTenantJson('orders:activity:v1', []);
    clearOrdersDialog.close();
    setSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, [clearOrdersDialog]);

  const handleResetPricing = useCallback(() => {
    // Remove pricing config — next load will seed defaults
    deleteTenantJson('pricing:v3');
    resetPricingDialog.close();
    setSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, [resetPricingDialog]);

  const handleFactoryReset = useCallback(() => {
    clearAllTenantData();
    factoryResetDialog.close();
    // Reset settings to defaults after factory reset
    const defaults = resetSettings();
    setSettings(defaults);
    setDirty(false);
    setSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }, [factoryResetDialog]);

  // Order number preview
  const orderNumberPreview = (() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    return settings.orderNumberFormat
      .replace('{PREFIX}', settings.orderNumberPrefix)
      .replace('{YYYY}', yyyy)
      .replace('{NNNN}', '0042');
  })();

  return (
    <div style={{ maxWidth: '900px' }}>
      <ForgePageHeader
        title={t('admin.settings.title', 'Nastaveni')}
        breadcrumb={t('admin.settings.breadcrumb', 'ADMIN / NASTAVENI')}
        actions={
          <button
            style={{ ...saveBtnStyle, opacity: dirty ? 1 : 0.5 }}
            onClick={handleSave}
            disabled={!dirty}
          >
            <Icon name="Save" size={16} />
            {t('admin.settings.saveBtn', 'Ulozit zmeny')}
          </button>
        }
      />

      {/* ─── 1. General ────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>
          <Icon name="Globe" size={18} style={{ color: 'var(--forge-accent-primary)' }} />
          {t('admin.settings.generalTitle', 'Obecne nastaveni')}
        </div>
        <div style={gridStyle}>
          <ForgeSelect
            label={t('admin.settings.currency', 'Vychozi mena')}
            value={settings.currency}
            onChange={(e) => update('currency', e.target.value)}
            options={CURRENCY_OPTIONS}
          />
          <ForgeSelect
            label={t('admin.settings.language', 'Vychozi jazyk')}
            value={settings.language}
            onChange={(e) => update('language', e.target.value)}
            options={LANGUAGE_OPTIONS}
          />
          <ForgeSelect
            label={t('admin.settings.timezone', 'Casova zona')}
            value={settings.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            options={TIMEZONE_OPTIONS}
          />
          <ForgeSelect
            label={t('admin.settings.dateFormat', 'Format datumu')}
            value={settings.dateFormat}
            onChange={(e) => update('dateFormat', e.target.value)}
            options={DATE_FORMAT_OPTIONS}
          />
          <ForgeSelect
            label={t('admin.settings.decimalSeparator', 'Oddelovac desetinnych mist')}
            value={settings.decimalSeparator}
            onChange={(e) => update('decimalSeparator', e.target.value)}
            options={DECIMAL_SEPARATOR_OPTIONS}
          />
        </div>
      </div>

      {/* ─── 2. Orders ─────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>
          <Icon name="ShoppingCart" size={18} style={{ color: 'var(--forge-accent-secondary, #FF6B35)' }} />
          {t('admin.settings.ordersTitle', 'Nastaveni objednavek')}
        </div>

        <div style={rowStyle}>
          <div>
            <div style={rowLabelStyle}>{t('admin.settings.orderAutoNumber', 'Automaticke cislovani objednavek')}</div>
            <div style={rowDescStyle}>{t('admin.settings.orderAutoNumberDesc', 'Pridelovat cisla objednavkam automaticky')}</div>
          </div>
          <ForgeToggle
            checked={settings.orderAutoNumber}
            onChange={() => update('orderAutoNumber', !settings.orderAutoNumber)}
          />
        </div>

        {settings.orderAutoNumber && (
          <div style={{ ...gridStyle, marginTop: '16px' }}>
            <ForgeInput
              label={t('admin.settings.orderPrefix', 'Prefix cisla objednavky')}
              value={settings.orderNumberPrefix}
              onChange={(e) => update('orderNumberPrefix', e.target.value)}
              placeholder="ORD"
            />
            <ForgeInput
              label={t('admin.settings.orderFormat', 'Format cisla')}
              value={settings.orderNumberFormat}
              onChange={(e) => update('orderNumberFormat', e.target.value)}
              placeholder="{PREFIX}-{YYYY}-{NNNN}"
            />
            <div>
              <div style={{
                fontFamily: 'var(--forge-font-body)',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: 'var(--forge-text-muted, #7A8291)',
                marginBottom: '6px',
              }}>
                {t('admin.settings.orderPreview', 'Nahled')}
              </div>
              <div style={{
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                backgroundColor: 'var(--forge-bg-elevated)',
                border: '1px solid var(--forge-border-default)',
                borderRadius: 'var(--forge-radius-sm)',
                fontFamily: 'var(--forge-font-tech, "Space Mono", monospace)',
                fontSize: '13px',
                color: 'var(--forge-accent-primary, #00D4AA)',
              }}>
                {orderNumberPreview}
              </div>
            </div>
          </div>
        )}

        <div style={{ ...gridStyle, marginTop: '16px' }}>
          <ForgeSelect
            label={t('admin.settings.orderStatus', 'Vychozi stav nove objednavky')}
            value={settings.orderDefaultStatus}
            onChange={(e) => update('orderDefaultStatus', e.target.value)}
            options={ORDER_STATUS_OPTIONS}
          />
          <ForgeInput
            label={t('admin.settings.autoArchive', 'Auto-archivace po (dny)')}
            type="number"
            value={settings.orderAutoArchiveDays}
            onChange={(e) => update('orderAutoArchiveDays', parseInt(e.target.value, 10) || 0)}
            placeholder="90"
          />
        </div>
      </div>

      {/* ─── 3. Notifications ──────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>
          <Icon name="Bell" size={18} style={{ color: '#F59E0B' }} />
          {t('admin.settings.notificationsTitle', 'Notifikace')}
        </div>

        <div style={rowStyle}>
          <div>
            <div style={rowLabelStyle}>{t('admin.settings.emailNotif', 'Emailove notifikace')}</div>
            <div style={rowDescStyle}>{t('admin.settings.emailNotifDesc', 'Zasilat emailova oznameni pri zmene stavu objednavek')}</div>
          </div>
          <ForgeToggle
            checked={settings.emailNotifications}
            onChange={() => update('emailNotifications', !settings.emailNotifications)}
          />
        </div>

        <div style={rowStyle}>
          <div>
            <div style={rowLabelStyle}>{t('admin.settings.soundNotif', 'Zvukove notifikace')}</div>
            <div style={rowDescStyle}>{t('admin.settings.soundNotifDesc', 'Prehravat zvuk pri novych udalostech')}</div>
          </div>
          <ForgeToggle
            checked={settings.soundNotifications}
            onChange={() => update('soundNotifications', !settings.soundNotifications)}
          />
        </div>

        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <div>
            <div style={rowLabelStyle}>{t('admin.settings.desktopNotif', 'Desktopove notifikace')}</div>
            <div style={rowDescStyle}>
              {typeof Notification !== 'undefined' && Notification.permission === 'granted'
                ? t('admin.settings.desktopGranted', 'Povoleno v prohlizeci')
                : t('admin.settings.desktopRequest', 'Vyzaduje povoleni v prohlizeci')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {typeof Notification !== 'undefined' && Notification.permission !== 'granted' && (
              <button
                style={{ ...linkBtnStyle, fontSize: '12px', padding: '6px 12px' }}
                onClick={requestDesktopPermission}
              >
                {t('admin.settings.desktopAllow', 'Povolit')}
              </button>
            )}
            <ForgeToggle
              checked={settings.desktopNotifications}
              onChange={() => update('desktopNotifications', !settings.desktopNotifications)}
              disabled={typeof Notification !== 'undefined' && Notification.permission === 'denied'}
            />
          </div>
        </div>
      </div>

      {/* ─── 4. Display ────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>
          <Icon name="Monitor" size={18} style={{ color: '#8B5CF6' }} />
          {t('admin.settings.displayTitle', 'Zobrazeni')}
        </div>

        <div style={gridStyle}>
          <ForgeSelect
            label={t('admin.settings.defaultView', 'Vychozi stranka po prihlaseni')}
            value={settings.defaultAdminView}
            onChange={(e) => update('defaultAdminView', e.target.value)}
            options={DEFAULT_VIEW_OPTIONS}
          />
          <ForgeSelect
            label={t('admin.settings.itemsPerPage', 'Polozek na stranku v tabulkach')}
            value={settings.itemsPerPage}
            onChange={(e) => update('itemsPerPage', parseInt(e.target.value, 10))}
            options={ITEMS_PER_PAGE_OPTIONS}
          />
          <ForgeSelect
            label={t('admin.settings.dateDisplay', 'Zobrazeni datumu')}
            value={settings.dateDisplayFormat}
            onChange={(e) => update('dateDisplayFormat', e.target.value)}
            options={DATE_DISPLAY_OPTIONS}
          />
        </div>

        <div style={{ ...rowStyle, marginTop: '16px', borderBottom: 'none' }}>
          <div>
            <div style={rowLabelStyle}>{t('admin.settings.compactMode', 'Kompaktni rezim')}</div>
            <div style={rowDescStyle}>{t('admin.settings.compactModeDesc', 'Zobrazit hustejsi UI s mensimi mezerami')}</div>
          </div>
          <ForgeToggle
            checked={settings.compactMode}
            onChange={() => update('compactMode', !settings.compactMode)}
          />
        </div>
      </div>

      {/* ─── 5. Data Management ────────────────────────────────────────── */}
      <div style={{ ...cardStyle, borderColor: 'var(--forge-border-active, #2A2E35)' }}>
        <div style={cardTitleStyle}>
          <Icon name="Database" size={18} style={{ color: 'var(--forge-error, #EF4444)' }} />
          {t('admin.settings.dataTitle', 'Sprava dat')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Clear orders */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div style={rowLabelStyle}>{t('admin.settings.clearOrders', 'Smazat vsechny objednavky')}</div>
              <div style={rowDescStyle}>{t('admin.settings.clearOrdersDesc', 'Trvale odstrani vsechny objednavky a jejich historii')}</div>
            </div>
            <button
              style={dangerBtnStyle}
              onClick={clearOrdersDialog.open}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon name="Trash2" size={14} />
              {t('admin.settings.clearOrdersBtn', 'Smazat objednavky')}
            </button>
          </div>

          {/* Reset pricing */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div style={rowLabelStyle}>{t('admin.settings.resetPricing', 'Obnovit vychozi cenik')}</div>
              <div style={rowDescStyle}>{t('admin.settings.resetPricingDesc', 'Resetuje cenovou konfiguraci na vychozi hodnoty')}</div>
            </div>
            <button
              style={dangerBtnStyle}
              onClick={resetPricingDialog.open}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon name="RotateCcw" size={14} />
              {t('admin.settings.resetPricingBtn', 'Reset ceniku')}
            </button>
          </div>

          {/* Factory reset */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', marginTop: '8px',
            backgroundColor: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--forge-radius-sm)',
          }}>
            <div>
              <div style={{ ...rowLabelStyle, color: 'var(--forge-error, #EF4444)' }}>
                {t('admin.settings.factoryReset', 'Tovarni reset')}
              </div>
              <div style={rowDescStyle}>
                {t('admin.settings.factoryResetDesc', 'Smaze VSECHNA data tohoto tenantu — objednavky, cenik, branding, presety, vse')}
              </div>
            </div>
            <button
              style={{ ...dangerBtnStyle, borderWidth: '2px' }}
              onClick={factoryResetDialog.open}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon name="AlertTriangle" size={14} />
              {t('admin.settings.factoryReset', 'Tovarni reset')}
            </button>
          </div>

          {/* Backup link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', marginTop: '4px' }}>
            <div>
              <div style={rowLabelStyle}>{t('admin.settings.backup', 'Zaloha a obnova')}</div>
              <div style={rowDescStyle}>{t('admin.settings.backupDesc', 'Exportovat/importovat konfiguraci jako JSON')}</div>
            </div>
            <button
              style={linkBtnStyle}
              onClick={() => navigate('/admin/system')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--forge-border-active)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--forge-border-default)'; }}
            >
              <Icon name="Download" size={14} />
              {t('admin.settings.backupBtn', 'System Health')}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Confirm Dialogs ───────────────────────────────────────────── */}
      <ForgeConfirmDialog
        isOpen={clearOrdersDialog.isOpen}
        onClose={clearOrdersDialog.close}
        onConfirm={handleClearOrders}
        title={t('admin.settings.clearOrdersDialogTitle', 'Smazat vsechny objednavky?')}
        message={t('admin.settings.clearOrdersDialogMsg', 'Tato akce trvale smaze vsechny objednavky a jejich historii aktivit. Tuto operaci nelze vzit zpet.')}
        confirmLabel={t('admin.settings.clearOrdersConfirm', 'Ano, smazat vse')}
        variant="danger"
      />

      <ForgeConfirmDialog
        isOpen={resetPricingDialog.isOpen}
        onClose={resetPricingDialog.close}
        onConfirm={handleResetPricing}
        title={t('admin.settings.resetPricingDialogTitle', 'Obnovit vychozi cenik?')}
        message={t('admin.settings.resetPricingDialogMsg', 'Cenova konfigurace bude nahrazena vychozimi hodnotami. Aktualni nastaveni bude ztraceno.')}
        confirmLabel={t('admin.settings.resetPricingConfirm', 'Ano, resetovat')}
        variant="danger"
      />

      <ForgeConfirmDialog
        isOpen={factoryResetDialog.isOpen}
        onClose={factoryResetDialog.close}
        onConfirm={handleFactoryReset}
        title={t('admin.settings.factoryDialogTitle', 'Tovarni reset — smazat VSECHNA data?')}
        message={t('admin.settings.factoryDialogMsg', 'Toto smaze VSECHNA data tenantu vcetne objednavek, ceniku, brandingu, presetu a vsech nastaveni. Tuto akci NELZE vratit. Pred pokracovanim doporucujeme provest zalohu v System Health.')}
        confirmLabel={t('admin.settings.factoryConfirm', 'Rozumim, smazat vse')}
        variant="danger"
      />

      {/* ─── Save toast ────────────────────────────────────────────────── */}
      {saved && (
        <div style={toastStyle}>
          <Icon name="Check" size={16} />
          {t('admin.settings.savedToast', 'Nastaveni ulozeno')}
        </div>
      )}

      {/* ─── Error toast ───────────────────────────────────────────────── */}
      {saveError && (
        <div style={errorToastStyle}>
          <Icon name="AlertTriangle" size={16} />
          {saveError}
        </div>
      )}
    </div>
  );
}
