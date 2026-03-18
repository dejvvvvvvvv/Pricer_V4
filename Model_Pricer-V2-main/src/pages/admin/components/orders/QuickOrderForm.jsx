import { useCallback, useMemo, useState } from 'react';
import Icon from '../../../../components/AppIcon';
import ForgeDialog from '../../../../components/ui/forge/ForgeDialog';
import { useAuth } from '../../../../context/AuthContext';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { loadOrders, saveOrders, nowIso, round2 } from '../../../../utils/adminOrdersStorage';
import { logActivity } from '../../../../utils/adminActivityLog';
import { generateId } from '../../../../utils/generateId';

/* -- Constants ------------------------------------------------------------ */

const PRIORITY_LEVELS = ['standard', 'express', 'rush'];

const PRIORITY_LABELS = {
  standard: { cs: 'Standardni', en: 'Standard' },
  express: { cs: 'Expresni', en: 'Express' },
  rush: { cs: 'Spechove', en: 'Rush' },
};

const EMPTY_MODEL = () => ({
  id: generateId('mdl'),
  name: '',
  material: 'PLA',
  quantity: 1,
  weight_g: 0,
  time_min: 0,
  price: 0,
});

/* -- Validation ----------------------------------------------------------- */

function validateForm(customer, models, cs) {
  const errors = [];

  if (!customer.name.trim()) {
    errors.push(cs ? 'Jmeno zakaznika je povinne' : 'Customer name is required');
  }
  if (!customer.email.trim()) {
    errors.push(cs ? 'Email zakaznika je povinny' : 'Customer email is required');
  } else if (customer.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email.trim())) {
    errors.push(cs ? 'Neplatny format emailu' : 'Invalid email format');
  }
  if (models.length === 0) {
    errors.push(cs ? 'Alespon jeden model je povinny' : 'At least one model is required');
  }
  for (let i = 0; i < models.length; i++) {
    if (!models[i].name.trim()) {
      errors.push(cs ? `Model ${i + 1}: nazev je povinny` : `Model ${i + 1}: name is required`);
    }
    if (models[i].quantity < 1) {
      errors.push(cs ? `Model ${i + 1}: mnozstvi musi byt alespon 1` : `Model ${i + 1}: quantity must be at least 1`);
    }
  }
  return errors;
}

/* -- Main Component ------------------------------------------------------- */

export default function QuickOrderForm({ open, onClose, onCreated }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const { language } = useLanguage();
  const cs = language === 'cs';

  // Customer
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Models
  const [models, setModels] = useState([EMPTY_MODEL()]);

  // Options
  const [priority, setPriority] = useState('standard');
  const [notes, setNotes] = useState('');
  const [initialStatus] = useState('NEW');

  // UI state
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  // -- Model CRUD --

  const addModel = useCallback(() => {
    setModels(prev => [...prev, EMPTY_MODEL()]);
  }, []);

  const removeModel = useCallback((idx) => {
    setModels(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  }, []);

  const updateModel = useCallback((idx, field, value) => {
    setModels(prev => prev.map((m, i) => {
      if (i !== idx) return m;
      const numericFields = ['quantity', 'weight_g', 'time_min', 'price'];
      const val = numericFields.includes(field) ? Number(value) || 0 : value;
      return { ...m, [field]: val };
    }));
  }, []);

  // -- Totals --

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalWeight = 0;
    let totalTime = 0;
    let totalPieces = 0;

    for (const m of models) {
      const qty = Math.max(1, m.quantity || 1);
      subtotal += (m.price || 0) * qty;
      totalWeight += (m.weight_g || 0) * qty;
      totalTime += (m.time_min || 0) * qty;
      totalPieces += qty;
    }

    return {
      subtotal: round2(subtotal),
      totalWeight: round2(totalWeight),
      totalTime: round2(totalTime),
      totalPieces,
      total: round2(subtotal),
    };
  }, [models]);

  // -- Submit --

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setErrors([]);
    setSuccess(null);

    const customer = {
      name: customerName.trim(),
      email: customerEmail.trim(),
      phone: customerPhone.trim(),
    };

    const validationErrors = validateForm(customer, models, cs);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      // Scroll to top so errors are visible
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
      return;
    }

    setSubmitting(true);

    try {
      const orderId = generateId('ord');
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const now = nowIso();

      const orderModels = models.map((m) => ({
        id: m.id,
        file_name: m.name,
        material_snapshot: { name: m.material },
        slicer_snapshot: {
          weight_g: m.weight_g,
          time_min: m.time_min,
        },
        price_breakdown_snapshot: {
          model_total: m.price,
        },
        quantity: Math.max(1, m.quantity || 1),
        flags: [],
      }));

      const order = {
        id: orderId,
        order_number: orderNumber,
        status: initialStatus,
        priority,
        customer,
        models: orderModels,
        one_time_fees: [],
        totals_snapshot: {
          subtotal_models: totals.subtotal,
          total: totals.total,
          sum_weight_g: totals.totalWeight,
          sum_time_min: totals.totalTime,
          sum_pieces: totals.totalPieces,
        },
        notes: notes.trim() ? [
          {
            id: generateId('note'),
            text: notes.trim(),
            author: currentUser,
            created_at: now,
          },
        ] : [],
        flags: [],
        activity: [
          {
            action: 'ORDER_CREATED',
            actor: currentUser,
            timestamp: now,
            details: cs ? 'Objednavka vytvorena rucne' : 'Order created manually',
          },
        ],
        created_at: now,
        updated_at: now,
      };

      // Save
      const existing = loadOrders();
      saveOrders([order, ...existing]);

      // Activity log
      logActivity({
        action: `ORDER_CREATED: ${orderNumber}`,
        category: 'order',
        details: `${customer.name} (${customer.email}), ${models.length} model(s), ${totals.total} Kc`,
        user: currentUser,
      });

      setSuccess({ id: orderId, orderNumber });
      onCreated?.({ id: orderId, orderNumber });
    } catch (err) {
      setErrors([cs ? `Chyba pri ukladani: ${err.message}` : `Save error: ${err.message}`]);
    } finally {
      setSubmitting(false);
    }
  }, [customerName, customerEmail, customerPhone, models, priority, notes, initialStatus, totals, cs, onCreated, currentUser]);

  // -- Reset form --

  const resetForm = useCallback(() => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setModels([EMPTY_MODEL()]);
    setPriority('standard');
    setNotes('');
    setErrors([]);
    setSuccess(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose?.();
  }, [resetForm, onClose]);

  // -- Render --

  const dialogTitle = success
    ? (cs ? 'Objednavka vytvorena' : 'Order created')
    : (cs ? 'Nova objednavka' : 'New order');

  const footerButtons = success ? (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button className="qof-btn qof-btn--secondary" onClick={handleClose}>
        {cs ? 'Zavrit' : 'Close'}
      </button>
      <button className="qof-btn qof-btn--primary" onClick={() => { resetForm(); }}>
        <Icon name="Plus" size={14} />
        {cs ? 'Dalsi objednavka' : 'Another order'}
      </button>
    </div>
  ) : (
    <div style={{ display: 'flex', gap: '10px' }}>
      <button type="button" className="qof-btn qof-btn--secondary" onClick={handleClose}>
        {cs ? 'Zrusit' : 'Cancel'}
      </button>
      <button
        type="button"
        className="qof-btn qof-btn--primary"
        disabled={submitting}
        onClick={handleSubmit}
      >
        {submitting ? (
          <>{cs ? 'Ukladam...' : 'Saving...'}</>
        ) : (
          <>
            <Icon name="Check" size={16} />
            {cs ? 'Vytvorit objednavku' : 'Create order'}
          </>
        )}
      </button>
    </div>
  );

  return (
    <ForgeDialog
      open={open}
      onClose={handleClose}
      title={dialogTitle}
      maxWidth="860px"
      footer={footerButtons}
    >
      <style>{quickOrderStyles}</style>

      {success ? (
        <div className="qof-success">
          <div className="qof-success-icon">
            <Icon name="CheckCircle" size={48} color="#00D4AA" />
          </div>
          <p className="qof-success-id">{success.orderNumber}</p>
        </div>
      ) : (
        <div className="qof-form-content">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="qof-errors">
              <Icon name="AlertCircle" size={16} color="#EF4444" />
              <ul>
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          {/* Section: Customer */}
          <div className="qof-section">
            <h3 className="qof-section-title">
              <Icon name="User" size={16} />
              {cs ? 'Zakaznik' : 'Customer'}
            </h3>
            <div className="qof-fields-row">
              <div className="qof-field">
                <label className="qof-label">{cs ? 'Jmeno' : 'Name'} *</label>
                <input
                  className="qof-input"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={cs ? 'Jan Novak' : 'John Doe'}
                  maxLength={200}
                />
              </div>
              <div className="qof-field">
                <label className="qof-label">Email *</label>
                <input
                  className="qof-input"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jan@firma.cz"
                  maxLength={254}
                />
              </div>
              <div className="qof-field qof-field--narrow">
                <label className="qof-label">{cs ? 'Telefon' : 'Phone'}</label>
                <input
                  className="qof-input"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+420 ..."
                  maxLength={30}
                />
              </div>
            </div>
          </div>

          {/* Section: Models */}
          <div className="qof-section">
            <div className="qof-section-header">
              <h3 className="qof-section-title">
                <Icon name="Box" size={16} />
                {cs ? 'Modely' : 'Models'}
              </h3>
              <button type="button" className="qof-btn qof-btn--small qof-btn--primary" onClick={addModel}>
                <Icon name="Plus" size={14} />
                {cs ? 'Pridat model' : 'Add model'}
              </button>
            </div>

            <div className="qof-models-list">
              {models.map((model, idx) => (
                <div key={model.id} className="qof-model-card">
                  <div className="qof-model-header">
                    <span className="qof-model-number">#{idx + 1}</span>
                    {models.length > 1 && (
                      <button
                        type="button"
                        className="qof-remove-btn"
                        onClick={() => removeModel(idx)}
                        aria-label={cs ? 'Odebrat model' : 'Remove model'}
                      >
                        <Icon name="Minus" size={14} />
                      </button>
                    )}
                  </div>
                  <div className="qof-model-fields">
                    <div className="qof-field qof-field--wide">
                      <label className="qof-label">{cs ? 'Nazev' : 'Name'} *</label>
                      <input
                        className="qof-input"
                        type="text"
                        value={model.name}
                        onChange={(e) => updateModel(idx, 'name', e.target.value)}
                        placeholder={cs ? 'Nazev modelu' : 'Model name'}
                      />
                    </div>
                    <div className="qof-field">
                      <label className="qof-label">{cs ? 'Material' : 'Material'}</label>
                      <input
                        className="qof-input"
                        type="text"
                        value={model.material}
                        onChange={(e) => updateModel(idx, 'material', e.target.value)}
                        placeholder="PLA"
                      />
                    </div>
                    <div className="qof-field qof-field--narrow">
                      <label className="qof-label">{cs ? 'Pocet' : 'Qty'}</label>
                      <input
                        className="qof-input qof-input--number"
                        type="number"
                        min="1"
                        value={model.quantity}
                        onChange={(e) => updateModel(idx, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="qof-field qof-field--narrow">
                      <label className="qof-label">{cs ? 'Vaha (g)' : 'Weight (g)'}</label>
                      <input
                        className="qof-input qof-input--number"
                        type="number"
                        min="0"
                        step="0.1"
                        value={model.weight_g}
                        onChange={(e) => updateModel(idx, 'weight_g', e.target.value)}
                      />
                    </div>
                    <div className="qof-field qof-field--narrow">
                      <label className="qof-label">{cs ? 'Cas (min)' : 'Time (min)'}</label>
                      <input
                        className="qof-input qof-input--number"
                        type="number"
                        min="0"
                        step="1"
                        value={model.time_min}
                        onChange={(e) => updateModel(idx, 'time_min', e.target.value)}
                      />
                    </div>
                    <div className="qof-field qof-field--narrow">
                      <label className="qof-label">{cs ? 'Cena (Kc)' : 'Price'}</label>
                      <input
                        className="qof-input qof-input--number"
                        type="number"
                        min="0"
                        step="1"
                        value={model.price}
                        onChange={(e) => updateModel(idx, 'price', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Order Options */}
          <div className="qof-section">
            <h3 className="qof-section-title">
              <Icon name="Settings" size={16} />
              {cs ? 'Moznosti' : 'Options'}
            </h3>
            <div className="qof-fields-row">
              <div className="qof-field">
                <label className="qof-label">{cs ? 'Priorita' : 'Priority'}</label>
                <div className="qof-priority-group">
                  {PRIORITY_LEVELS.map(p => (
                    <button
                      key={p}
                      type="button"
                      className={`qof-priority-btn${priority === p ? ' qof-priority-btn--active' : ''}${p === 'rush' ? ' qof-priority-btn--rush' : ''}`}
                      onClick={() => setPriority(p)}
                    >
                      {cs ? PRIORITY_LABELS[p].cs : PRIORITY_LABELS[p].en}
                    </button>
                  ))}
                </div>
              </div>
              <div className="qof-field qof-field--wide">
                <label className="qof-label">{cs ? 'Interni poznamky' : 'Internal notes'}</label>
                <textarea
                  className="qof-textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={cs ? 'Poznamky k objednavce...' : 'Order notes...'}
                  maxLength={2000}
                />
              </div>
            </div>
          </div>

          {/* Section: Totals */}
          <div className="qof-section">
            <div className="qof-totals">
              <div className="qof-totals-row">
                <span className="qof-totals-label">{cs ? 'Modely' : 'Models'}</span>
                <span className="qof-totals-value">{models.length} ({totals.totalPieces} ks)</span>
              </div>
              <div className="qof-totals-row">
                <span className="qof-totals-label">{cs ? 'Vaha celkem' : 'Total weight'}</span>
                <span className="qof-totals-value">{totals.totalWeight} g</span>
              </div>
              <div className="qof-totals-row">
                <span className="qof-totals-label">{cs ? 'Cas celkem' : 'Total time'}</span>
                <span className="qof-totals-value">{totals.totalTime} min</span>
              </div>
              <div className="qof-totals-divider" />
              <div className="qof-totals-row qof-totals-row--total">
                <span className="qof-totals-label">{cs ? 'Celkem' : 'Total'}</span>
                <span className="qof-totals-value">{totals.total} Kc</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </ForgeDialog>
  );
}

/* -- Styles --------------------------------------------------------------- */

const quickOrderStyles = `
  /* Form content layout */
  .qof-form-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Errors */
  .qof-errors {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--forge-radius-md, 6px);
  }

  .qof-errors ul {
    margin: 0;
    padding: 0 0 0 16px;
    font-size: 13px;
    color: #F87171;
    line-height: 1.6;
  }

  /* Sections */
  .qof-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-margin-top: 8px;
  }

  .qof-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .qof-section-title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
    display: flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Fields */
  .qof-fields-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .qof-field {
    flex: 1;
    min-width: 140px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .qof-field--wide { flex: 2; min-width: 200px; }
  .qof-field--narrow { flex: 0 0 100px; min-width: 80px; }

  .qof-label {
    font-size: 11px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    color: var(--forge-text-muted, #7A8291);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .qof-input,
  .qof-textarea {
    padding: 8px 12px;
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    color: var(--forge-text-primary, #F1F5F9);
    font-size: 13px;
    font-family: var(--forge-font-body, 'IBM Plex Sans', sans-serif);
    transition: border-color 0.15s;
  }

  .qof-input:focus,
  .qof-textarea:focus {
    outline: none;
    border-color: var(--forge-accent-primary, #00D4AA);
    box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.12);
  }

  .qof-input--number {
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    text-align: right;
  }

  .qof-textarea {
    resize: vertical;
    min-height: 48px;
  }

  /* Models */
  .qof-models-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .qof-model-card {
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    padding: 12px 16px;
  }

  .qof-model-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .qof-model-number {
    font-size: 12px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-accent-primary, #00D4AA);
    font-weight: 600;
  }

  .qof-remove-btn {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #F87171;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .qof-remove-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
  }

  .qof-model-fields {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* Priority */
  .qof-priority-group {
    display: flex;
    gap: 6px;
  }

  .qof-priority-btn {
    padding: 6px 14px;
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    background: var(--forge-bg-elevated, #0D1117);
    color: var(--forge-text-secondary, #94A3B8);
    font-size: 12px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    cursor: pointer;
    transition: all 0.15s;
  }

  .qof-priority-btn:hover {
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .qof-priority-btn--active {
    background: rgba(0, 212, 170, 0.1);
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-accent-primary, #00D4AA);
    font-weight: 600;
  }

  .qof-priority-btn--rush.qof-priority-btn--active {
    background: rgba(239, 68, 68, 0.1);
    border-color: #EF4444;
    color: #F87171;
  }

  /* Totals */
  .qof-totals {
    background: var(--forge-bg-elevated, #0D1117);
    border: 1px solid var(--forge-border-default, #1E293B);
    border-radius: var(--forge-radius-md, 6px);
    padding: 16px 20px;
  }

  .qof-totals-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }

  .qof-totals-label {
    font-size: 12px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    color: var(--forge-text-muted, #7A8291);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .qof-totals-value {
    font-size: 13px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 600;
  }

  .qof-totals-divider {
    height: 1px;
    background: var(--forge-border-default, #1E293B);
    margin: 8px 0;
  }

  .qof-totals-row--total .qof-totals-label {
    color: var(--forge-text-primary, #F1F5F9);
    font-weight: 700;
    font-size: 13px;
  }

  .qof-totals-row--total .qof-totals-value {
    color: var(--forge-accent-primary, #00D4AA);
    font-size: 18px;
  }

  /* Buttons */
  .qof-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: var(--forge-radius-md, 6px);
    font-size: 13px;
    font-family: var(--forge-font-tech, 'Space Mono', monospace);
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    letter-spacing: 0.02em;
  }

  .qof-btn--primary {
    background: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-bg-void, #0A0E17);
  }

  .qof-btn--primary:hover:not(:disabled) {
    background: #00E8BB;
    box-shadow: 0 0 16px rgba(0, 212, 170, 0.25);
  }

  .qof-btn--primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .qof-btn--secondary {
    background: var(--forge-bg-surface, #111827);
    color: var(--forge-text-secondary, #94A3B8);
    border-color: var(--forge-border-default, #1E293B);
  }

  .qof-btn--secondary:hover {
    background: var(--forge-bg-elevated, #1E293B);
    border-color: var(--forge-accent-primary, #00D4AA);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .qof-btn--small {
    padding: 5px 12px;
    font-size: 11px;
  }

  /* Success */
  .qof-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 48px 24px;
    text-align: center;
    flex: 1;
  }

  .qof-success-icon {
    animation: qof-popIn 0.3s ease;
  }

  @keyframes qof-popIn {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .qof-success-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    font-family: var(--forge-font-heading, 'Space Grotesk', sans-serif);
    color: var(--forge-text-primary, #F1F5F9);
  }

  .qof-success-id {
    margin: 0;
    font-size: 14px;
    font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
    color: var(--forge-accent-primary, #00D4AA);
    font-weight: 600;
  }

  .qof-success-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .qof-fields-row {
      flex-direction: column;
    }

    .qof-field--narrow {
      flex: 1;
      min-width: 100%;
    }

    .qof-model-fields {
      flex-direction: column;
    }

    .qof-model-fields .qof-field--narrow {
      flex: 1;
    }

    .qof-priority-group {
      flex-wrap: wrap;
    }
  }
`;
