// src/pages/account/components/AccountOverviewCard.jsx
import React, { useMemo, useState } from 'react';
import { auth } from '../../../firebase'; // cesta podle tvého projektu
import { sendEmailVerification } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Link } from 'react-router-dom';

function Avatar({ user }) {
  const letter = useMemo(() => (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase(), [user]);
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName || user.email || 'User'}
        className="w-16 h-16 rounded-full object-cover border border-border"
      />
    );
  }
  return (
    <div className="w-16 h-16 rounded-full bg-muted text-foreground/80 flex items-center justify-center text-xl font-semibold border border-border">
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
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="animate-pulse h-16 w-16 rounded-full bg-muted mb-4" />
        <div className="h-4 bg-muted rounded w-1/3 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    );
  }

  const emailVerified = !!user.emailVerified;
  const lastSignIn = user.metadata?.lastSignInTime;

  const handleSendVerification = async () => {
    try {
      setSending(true);
      setMessage(null);
      await sendEmailVerification(user); // Firebase v9 – pošle ověřovací e-mail
      setSent(true);
      setMessage('Ověřovací e-mail byl odeslán. Zkontrolujte svou schránku.');
    } catch (e) {
      console.error(e);
      setMessage('Nepodařilo se odeslat ověřovací e-mail. Zkuste to prosím znovu.');
    } finally {
      setSending(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setRevoking(true);
      setMessage(null);
      const functions = getFunctions();
      const fn = httpsCallable(functions, 'revokeUserTokens'); // viz Cloud Function níže
      await fn({ uid: user.uid });
      setMessage('Všechny relace budou odhlášeny během následující hodiny.');
    } catch (e) {
      console.error(e);
      setMessage('Nepodařilo se odhlásit na všech zařízeních.');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Avatar user={user} />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{user.displayName || 'Uživatel'}</h2>
          <div className="mt-1 text-sm text-muted-foreground break-all">{user.email}</div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {emailVerified ? (
              <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                E-mail ověřen
              </span>
            ) : (
              <>
                <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                  E-mail neověřen
                </span>
                <button
                  onClick={handleSendVerification}
                  disabled={sending || sent}
                  className="inline-flex items-center rounded-lg bg-black px-3 py-1.5 text-xs text-white hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? 'Odesílám…' : sent ? 'Odesláno' : 'Poslat ověřovací e-mail'}
                </button>
              </>
            )}
            {lastSignIn && (
              <span className="ml-auto text-xs text-muted-foreground">Poslední přihlášení: {lastSignIn}</span>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/account#profile"
              className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Upravit profil
            </Link>
            <Link
              to="/account#security"
              className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Změnit heslo
            </Link>
            <button
              onClick={handleRevokeAllSessions}
              disabled={revoking}
              className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
              title="Odhlásí vás postupně ze všech zařízení (po expiraci ID tokenu)."
            >
              {revoking ? 'Probíhá…' : 'Odhlásit na všech zařízeních'}
            </button>
          </div>

          {message && <div className="mt-3 text-sm text-muted-foreground">{message}</div>}
        </div>
      </div>
    </div>
  );
}
