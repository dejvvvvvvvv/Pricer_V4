import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/AppIcon';
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 border border-white/10">
            <Icon name="users" size={18} />
          </div>
          <div>
            <div className="text-xl font-bold">Accept invite</div>
            <div className="text-sm text-white/60">ModelPricer — Demo (Varianta A)</div>
          </div>
        </div>

        {!token && (
          <div className="mt-6 p-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-100 text-sm">
            Missing invite token.
          </div>
        )}

        {token && !invite && (
          <div className="mt-6 p-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-100 text-sm">
            Invalid / expired invite.
          </div>
        )}

        {invite && !done && (
          <div className="mt-6">
            <div className="text-sm text-white/70">
              You have been invited as <span className="font-semibold">{invite.role}</span> to tenant{' '}
              <span className="font-semibold">{invite.tenant_id}</span>.
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/60 mb-1">Your name (optional)</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-600/20 border border-red-500/30 text-red-100 text-sm">
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                className="ml-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
              >
                Accept invite
              </button>
            </div>
          </div>
        )}

        {invite && done && (
          <div className="mt-6 p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 text-sm">
            Invite accepted. Redirecting to Admin…
          </div>
        )}

        <div className="mt-6 text-xs text-white/40">
          This is a demo acceptance page for Varianta A (no real email / auth).
        </div>
      </div>
    </div>
  );
}
