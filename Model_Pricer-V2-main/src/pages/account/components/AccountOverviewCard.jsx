// src/pages/account/components/AccountOverviewCard.jsx
import React, { useMemo, useState } from 'react';
import { auth } from '../../../firebase'; // cesta podle tveho projektu
import { sendEmailVerification } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Link } from 'react-router-dom';

/* ──────────────────────────────────────────────────────────────────────────
   FORGE inline styles
   ────────────────────────────────────────────────────────────────────────── */

const cardStyles = {
  borderRadius: 'var(--forge-radius-md)',
  border: '1px solid var(--forge-border-default)',
  backgroundColor: 'var(--forge-bg-surface)',
  padding: '20px',
  boxShadow: 'var(--forge-shadow-sm)',
};

const skeletonBase = {
  borderRadius: 'var(--forge-radius-sm)',
  backgroundColor: 'var(--forge-bg-elevated)',
};

const badgeVerified = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '100px',
  border: '1px solid rgba(0,212,170,0.3)',
  backgroundColor: 'rgba(0,212,170,0.08)',
  padding: '2px 10px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--forge-accent-primary)',
  fontFamily: 'var(--forge-font-body)',
};

const badgeUnverified = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '100px',
  border: '1px solid rgba(255,181,71,0.3)',
  backgroundColor: 'rgba(255,181,71,0.08)',
  padding: '2px 10px',
  fontSize: '12px',
  fontWeight: 500,
  color: 'var(--forge-warning)',
  fontFamily: 'var(--forge-font-body)',
};

const actionBtnStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 'var(--forge-radius-sm)',
  border: '1px solid var(--forge-border-default)',
  backgroundColor: 'transparent',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--forge-text-secondary)',
  fontFamily: 'var(--forge-font-body)',
  cursor: 'pointer',
  transition: 'border-color 0.2s, color 0.2s, background-color 0.2s',
  textDecoration: 'none',
};

const verifyBtnStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 'var(--forge-radius-sm)',
  backgroundColor: 'var(--forge-accent-primary)',
  color: '#08090C',
  padding: '5px 12px',
  fontSize: '12px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--forge-font-body)',
  transition: 'opacity 0.2s',
};

/* ──────────────────────────────────────────────────────────────────────── */

function Avatar({ user }) {
  const letter = useMemo(() => (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase(), [user]);
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || user.email || 'User'}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '1px solid var(--forge-border-default)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: 'var(--forge-gradient-brand)',
      color: '#08090C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.25rem',
      fontFamily: 'var(--forge-font-heading)',
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {letter}
    </div>
  );
}

export default function AccountOverviewCard() {
  const user = auth.currentUser;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [message, setMessage] = useState(null);

  if (!user) {
    return (
      <div style={cardStyles}>
        <div style={{ ...skeletonBase, width: '56px', height: '56px', borderRadius: '50%', marginBottom: '16px' }}>
          {/* skeleton pulse — use CSS animation if available, otherwise static */}
        </div>
        <div style={{ ...skeletonBase, height: '16px', width: '33%', marginBottom: '8px' }} />
        <div style={{ ...skeletonBase, height: '12px', width: '50%' }} />
      </div>
    );
  }

  const emailVerified = !!user.emailVerified;
  const lastSignIn = user.metadata?.lastSignInTime;

  const handleSendVerification = async () => {
    try {
      setSending(true);
      setMessage(null);
      await sendEmailVerification(user);
      setSent(true);
      setMessage('Overovaci e-mail byl odeslan. Zkontrolujte svou schranku.');
    } catch (e) {
      console.error(e);
      setMessage('Nepodarilo se odeslat overovaci e-mail. Zkuste to prosim znovu.');
    } finally {
      setSending(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setRevoking(true);
      setMessage(null);
      const functions = getFunctions();
      const fn = httpsCallable(functions, 'revokeUserTokens');
      await fn({ uid: user.uid });
      setMessage('Vsechny relace budou odhlaseny behem nasledujici hodiny.');
    } catch (e) {
      console.error(e);
      setMessage('Nepodarilo se odhlasit na vsech zarizenich.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div style={cardStyles}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <Avatar user={user} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontWeight: 700,
            fontSize: 'var(--forge-text-xl)',
            color: 'var(--forge-text-primary)',
            margin: 0,
          }}>
            {user.displayName || 'Uzivatel'}
          </h2>
          <div style={{
            marginTop: '4px',
            fontSize: '14px',
            color: 'var(--forge-text-secondary)',
            wordBreak: 'break-all',
          }}>
            {user.email}
          </div>

          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {emailVerified ? (
              <span style={badgeVerified}>
                E-mail overen
              </span>
            ) : (
              <>
                <span style={badgeUnverified}>
                  E-mail neoveren
                </span>
                <button
                  onClick={handleSendVerification}
                  disabled={sending || sent}
                  style={{
                    ...verifyBtnStyles,
                    opacity: (sending || sent) ? 0.5 : 1,
                    cursor: (sending || sent) ? 'default' : 'pointer',
                  }}
                >
                  {sending ? 'Odesilam...' : sent ? 'Odeslano' : 'Poslat overovaci e-mail'}
                </button>
              </>
            )}
            {lastSignIn && (
              <span style={{
                marginLeft: 'auto',
                fontSize: '12px',
                color: 'var(--forge-text-muted)',
              }}>
                Posledni prihlaseni: {lastSignIn}
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <Link
              to="/account#profile"
              style={actionBtnStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
                e.currentTarget.style.color = 'var(--forge-accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                e.currentTarget.style.color = 'var(--forge-text-secondary)';
              }}
            >
              Upravit profil
            </Link>
            <Link
              to="/account#security"
              style={actionBtnStyles}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
                e.currentTarget.style.color = 'var(--forge-accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                e.currentTarget.style.color = 'var(--forge-text-secondary)';
              }}
            >
              Zmenit heslo
            </Link>
            <button
              onClick={handleRevokeAllSessions}
              disabled={revoking}
              style={{
                ...actionBtnStyles,
                opacity: revoking ? 0.5 : 1,
                cursor: revoking ? 'default' : 'pointer',
              }}
              title="Odhlasi vas postupne ze vsech zarizeni (po expiraci ID tokenu)."
              onMouseEnter={(e) => {
                if (!revoking) {
                  e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
                  e.currentTarget.style.color = 'var(--forge-accent-primary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--forge-border-default)';
                e.currentTarget.style.color = 'var(--forge-text-secondary)';
              }}
            >
              {revoking ? 'Probiha...' : 'Odhlasit na vsech zarizenich'}
            </button>
          </div>

          {message && (
            <div style={{
              marginTop: '12px',
              fontSize: '13px',
              color: 'var(--forge-text-secondary)',
            }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
