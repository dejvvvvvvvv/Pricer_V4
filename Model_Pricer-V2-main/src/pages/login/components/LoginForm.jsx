import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import ForgeButton from '@/components/ui/forge/ForgeButton';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import Icon from '@/components/AppIcon';
import { useTranslation } from 'react-i18next';
import { debug } from '@/lib/debug';

const createLoginSchema = (t) => z.object({
  email: z.string().email(t('loginForm.emailInvalid')),
  password: z.string().min(1, t('loginForm.passwordRequired')),
  rememberMe: z.boolean().optional(),
});

const inputStyle = {
  width: '100%',
  height: '44px',
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
  marginBottom: '6px',
  display: 'block',
};

const errorStyle = {
  fontSize: '11px',
  color: 'var(--forge-error)',
  marginTop: '4px',
  fontFamily: 'var(--forge-font-body)',
};

const LoginForm = ({ redirectTo = '/admin' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const loginSchema = createLoginSchema(t);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState(null); // 'success' | 'error' | null
  const [resetLoading, setResetLoading] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    setResetStatus(null);
    try {
      await resetPassword(resetEmail.trim());
      setResetStatus('success');
    } catch (err) {
      debug('Password reset error:', err);
      setResetStatus('error');
    } finally {
      setResetLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      let errorMessage = t('loginForm.genericError');
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = t('loginForm.invalidCredentials');
          break;
        case 'auth/too-many-requests':
          errorMessage = t('loginForm.tooManyRequests');
          break;
        default:
          debug("Login error:", error);
      }
      setError('root.serverError', { type: 'manual', message: errorMessage });
    }
  };

  const handleGoogleSuccess = () => {
    navigate(redirectTo, { replace: true });
  };

  const handleGoogleError = (err) => {
    if (err?.code === 'auth/popup-closed-by-user') return;
    debug('Google login error:', err);

    const msg = err?.code === 'auth/account-exists-with-different-credential'
      ? t('loginForm.accountExistsWithDifferentCredential', 'This email is already registered with a different method.')
      : t('loginForm.genericError', 'Prihlaseni selhalo. Zkuste to prosim znovu.');

    setError('root.serverError', { type: 'manual', message: msg });
  };

  const handleInputFocus = (e) => {
    e.target.style.borderColor = 'var(--forge-accent-primary)';
    e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
  };

  const handleInputBlur = (e) => {
    e.target.style.borderColor = 'var(--forge-border-default)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ width: '100%', maxWidth: '448px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={labelStyle}>{t('loginForm.emailLabel')}</label>
          <input
            type="email"
            placeholder="vas@email.cz"
            {...register('email')}
            disabled={isSubmitting}
            style={{
              ...inputStyle,
              borderColor: errors.email ? 'var(--forge-error)' : 'var(--forge-border-default)',
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {errors.email?.message && <div style={errorStyle}>{errors.email.message}</div>}
        </div>

        <div>
          <label style={labelStyle}>{t('loginForm.passwordLabel')}</label>
          <input
            type="password"
            placeholder={t('loginForm.passwordPlaceholder')}
            {...register('password')}
            disabled={isSubmitting}
            style={{
              ...inputStyle,
              borderColor: errors.password ? 'var(--forge-error)' : 'var(--forge-border-default)',
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
          {errors.password?.message && <div style={errorStyle}>{errors.password.message}</div>}
          <button
            type="button"
            onClick={() => { setShowResetForm(v => !v); setResetStatus(null); }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              marginTop: '6px',
              fontSize: '13px',
              color: 'var(--forge-accent-primary)',
              fontFamily: 'var(--forge-font-body)',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            {t('loginForm.forgotPassword', 'Zapomněli jste heslo?')}
          </button>
        </div>

        {showResetForm && (
          <div style={{
            padding: '14px',
            backgroundColor: 'var(--forge-bg-elevated)',
            border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-sm)',
          }}>
            <p style={{
              fontSize: '13px',
              color: 'var(--forge-text-secondary)',
              fontFamily: 'var(--forge-font-body)',
              margin: '0 0 10px 0',
            }}>
              {t('loginForm.resetEmailDescription', 'Zadejte váš email pro obnovení hesla')}
            </p>
            <form onSubmit={handlePasswordReset} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="vas@email.cz"
                disabled={resetLoading}
                required
                aria-label={t('loginForm.resetEmailDescription', 'Zadejte váš email pro obnovení hesla')}
                style={{
                  ...inputStyle,
                  flex: 1,
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <ForgeButton
                variant="secondary"
                type="submit"
                disabled={resetLoading || !resetEmail.trim()}
                style={{ height: '44px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {resetLoading
                  ? '...'
                  : t('loginForm.sendReset', 'Odeslat odkaz')}
              </ForgeButton>
            </form>
            {resetStatus === 'success' && (
              <div style={{
                marginTop: '8px',
                padding: '8px 10px',
                backgroundColor: 'rgba(0, 212, 170, 0.08)',
                border: '1px solid rgba(0, 212, 170, 0.25)',
                borderRadius: 'var(--forge-radius-sm)',
                fontSize: '12px',
                color: 'var(--forge-accent-primary)',
                fontFamily: 'var(--forge-font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Icon name="CheckCircle" size={14} />
                {t('loginForm.resetSuccess', 'Odkaz pro obnovení hesla byl odeslán na váš email.')}
              </div>
            )}
            {resetStatus === 'error' && (
              <div style={{
                marginTop: '8px',
                padding: '8px 10px',
                backgroundColor: 'rgba(255, 71, 87, 0.06)',
                border: '1px solid rgba(255, 71, 87, 0.2)',
                borderRadius: 'var(--forge-radius-sm)',
                fontSize: '12px',
                color: 'var(--forge-error)',
                fontFamily: 'var(--forge-font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Icon name="AlertCircle" size={14} />
                {t('loginForm.resetError', 'Nepodařilo se odeslat odkaz. Zkontrolujte email.')}
              </div>
            )}
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            {...register('rememberMe')}
            disabled={isSubmitting}
            style={{ accentColor: 'var(--forge-accent-primary)' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
            {t('loginForm.rememberMeLabel')}
          </span>
        </label>

        {errors.root?.serverError && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(255, 71, 87, 0.06)',
            border: '1px solid rgba(255, 71, 87, 0.2)',
            borderRadius: 'var(--forge-radius-sm)',
          }}>
            <p style={{
              fontSize: '13px',
              color: 'var(--forge-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--forge-font-body)',
              margin: 0,
            }}>
              <Icon name="AlertCircle" size={16} />
              <span>{errors.root.serverError.message}</span>
            </p>
          </div>
        )}

        <ForgeButton
          variant="primary"
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', height: '44px' }}
        >
          {isSubmitting ? t('loginForm.loggingIn') : t('loginForm.loginButton')}
        </ForgeButton>
      </form>

      {/* Divider */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: '20px 0',
      }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--forge-border-default)' }} />
        <span style={{
          fontSize: '12px',
          color: 'var(--forge-text-muted)',
          fontFamily: 'var(--forge-font-body)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {t('loginForm.or', 'or')}
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--forge-border-default)' }} />
      </div>

      {/* Google Sign-In */}
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        label={t('loginForm.signInWithGoogle', 'Sign in with Google')}
        disabled={isSubmitting}
      />

      {/* Register link */}
      <div style={{
        textAlign: 'center',
        paddingTop: '20px',
        borderTop: '1px solid var(--forge-border-default)',
        marginTop: '20px',
      }}>
        <p style={{
          fontSize: '13px',
          color: 'var(--forge-text-muted)',
          fontFamily: 'var(--forge-font-body)',
        }}>
          {t('loginForm.noAccount', "Don't have an account?")}{' '}
          <Link to="/register" style={{ color: 'var(--forge-accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            {t('loginForm.registerLink', 'Create account')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
