import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/AppIcon';
import ForgeButton from '../components/ui/forge/ForgeButton';
import { acceptInviteToken, getInviteByToken } from '../utils/adminTeamAccessStorage';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function InviteAccept() {
  const q = useQuery();
  const navigate = useNavigate();
  const token = q.get('token') || '';

  const invite = token ? getInviteByToken(token) : null;
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleAccept = () => {
    setError('');
    try {
      acceptInviteToken({ token, name });
      setDone(true);
      setTimeout(() => {
        navigate('/admin/team');
      }, 600);
    } catch (e) {
      setError(e?.message || 'Failed to accept invite');
    }
  };

  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: 'var(--forge-bg-void)',
    color: 'var(--forge-text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-lg)',
    padding: '24px',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const iconBoxStyle = {
    padding: '10px',
    borderRadius: 'var(--forge-radius-md)',
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    color: 'var(--forge-accent-primary)',
  };

  const titleStyle = {
    fontFamily: 'var(--forge-font-heading)',
    fontSize: 'var(--forge-text-xl)',
    fontWeight: 700,
    color: 'var(--forge-text-primary)',
  };

  const subtitleStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '12px',
    color: 'var(--forge-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const errorBoxStyle = {
    marginTop: '20px',
    padding: '12px',
    borderRadius: 'var(--forge-radius-md)',
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    border: '1px solid rgba(255, 71, 87, 0.2)',
    color: 'var(--forge-error)',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
  };

  const successBoxStyle = {
    marginTop: '20px',
    padding: '12px',
    borderRadius: 'var(--forge-radius-md)',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    border: '1px solid rgba(0, 212, 170, 0.2)',
    color: 'var(--forge-success)',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-body)',
  };

  const inputStyle = {
    width: '100%',
    height: '40px',
    padding: '0 12px',
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-sm)',
    fontSize: '14px',
    color: 'var(--forge-text-primary)',
    fontFamily: 'var(--forge-font-body)',
    outline: 'none',
    transition: 'border-color 120ms ease-out, box-shadow 120ms ease-out',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--forge-text-secondary)',
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <Icon name="Users" size={18} />
          </div>
          <div>
            <div style={titleStyle}>Accept Invite</div>
            <div style={subtitleStyle}>MODELPRICER TEAM</div>
          </div>
        </div>

        {!token && <div style={errorBoxStyle}>Missing invite token.</div>}

        {token && !invite && <div style={errorBoxStyle}>Invalid or expired invite.</div>}

        {invite && !done && (
          <div style={{ marginTop: '20px' }}>
            <div style={{
              fontSize: '14px',
              fontFamily: 'var(--forge-font-body)',
              color: 'var(--forge-text-secondary)',
              lineHeight: 1.5,
            }}>
              You have been invited as{' '}
              <span style={{
                fontWeight: 600,
                color: 'var(--forge-accent-primary)',
                fontFamily: 'var(--forge-font-mono)',
              }}>
                {invite.role}
              </span>{' '}
              to tenant{' '}
              <span style={{
                fontWeight: 600,
                fontFamily: 'var(--forge-font-mono)',
                color: 'var(--forge-text-primary)',
              }}>
                {invite.tenant_id}
              </span>.
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>YOUR NAME (OPTIONAL)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--forge-accent-primary)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--forge-border-default)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && <div style={errorBoxStyle}>{error}</div>}

            <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <ForgeButton variant="outline" onClick={() => navigate('/')}>
                Cancel
              </ForgeButton>
              <ForgeButton variant="primary" onClick={handleAccept}>
                Accept Invite
              </ForgeButton>
            </div>
          </div>
        )}

        {invite && done && (
          <div style={successBoxStyle}>
            Invite accepted. Redirecting to Admin...
          </div>
        )}

        <div style={{
          marginTop: '20px',
          fontSize: '11px',
          fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-disabled)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Demo acceptance page — no real email / auth
        </div>
      </div>
    </div>
  );
}
