import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import ForgeCheckbox from '../../../components/ui/forge/ForgeCheckbox';

/**
 * WidgetDomainsTab -- Tab 3: Domain whitelist management.
 *
 * Props:
 *   domains          - array of domain objects
 *   canUseWhitelist  - boolean (plan gate)
 *   onAddDomain      - (domainInput, allowSubdomains) => void
 *   onToggleDomain   - (domainId, enabled) => void
 *   onDeleteDomain   - (domainId) => void
 */
const WidgetDomainsTab = ({
  domains,
  canUseWhitelist,
  onAddDomain,
  onToggleDomain,
  onDeleteDomain,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [allowSubdomains, setAllowSubdomains] = useState(true);
  const [domainError, setDomainError] = useState(null);

  const handleAdd = () => {
    const candidate = String(domainInput || '').trim();
    if (!candidate) {
      setDomainError('Zadejte domenu.');
      return;
    }

    // Basic client-side check before forwarding to parent
    if (candidate.includes('://')) {
      setDomainError('Nezadavejte protokol (http/https).');
      return;
    }

    setDomainError(null);

    try {
      onAddDomain(candidate, allowSubdomains);
      setDomainInput('');
      setAllowSubdomains(true);
    } catch (e) {
      setDomainError(e?.message || 'Nelze pridat domenu.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  if (!canUseWhitelist) {
    return (
      <div className="aw-domains-tab">
        <div className="aw-limit-box">
          <Icon name="Lock" size={18} style={{ color: 'var(--forge-text-muted)' }} />
          <div>
            <strong style={{ color: 'var(--forge-text-primary)' }}>Whitelist domen neni dostupny</strong>
            <div className="aw-muted">
              Tato funkce neni dostupna v aktualnim tarifu. Pro povoleni whitelistu domen
              je potreba vyssi tarif.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="aw-domains-tab">
      <div className="aw-muted" style={{ marginBottom: 12 }}>
        Povolte domeny, na kterych bude widget fungovat. Wildcard subdomeny (*.firma.cz) jsou podporovany.
      </div>

      {/* Add domain form */}
      <div className="aw-domain-add-form">
        <input
          className={`aw-input ${domainError ? 'aw-input-error' : ''}`}
          value={domainInput}
          onChange={(e) => {
            setDomainInput(e.target.value);
            setDomainError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="napr. firma.cz"
        />
        <ForgeCheckbox
          checked={allowSubdomains}
          onChange={(e) => setAllowSubdomains(e.target.checked)}
          label="Povolit subdomeny"
        />
        <button className="aw-btn aw-btn-primary" onClick={handleAdd}>
          <Icon name="Plus" size={16} />
          Pridat
        </button>
      </div>
      {domainError ? <div className="aw-error-text">{domainError}</div> : null}

      {/* Domain list */}
      <div className="aw-domain-list">
        {domains.length === 0 ? (
          <div className="aw-empty-domains">
            <Icon name="Globe" size={18} />
            <span>Zatim zadna domena. Pro demo muzete pridat napr. localhost.</span>
          </div>
        ) : null}

        {domains.map((d) => (
          <div key={d.id} className="aw-domain-row">
            <div className="aw-domain-info">
              <div className="aw-domain-name">
                {d.domain}
                {d.allowSubdomains ? (
                  <span className="aw-domain-chip">*.{d.domain}</span>
                ) : null}
              </div>
              <div className="aw-muted">{d.isActive ? 'Aktivni' : 'Neaktivni'}</div>
            </div>

            <div className="aw-domain-actions">
              <ForgeCheckbox
                checked={!!d.isActive}
                onChange={(e) => onToggleDomain(d.id, e.target.checked)}
              />
              <button
                className="aw-icon-btn aw-icon-btn-danger"
                title="Smazat domenu"
                onClick={() => onDeleteDomain(d.id)}
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WidgetDomainsTab;
