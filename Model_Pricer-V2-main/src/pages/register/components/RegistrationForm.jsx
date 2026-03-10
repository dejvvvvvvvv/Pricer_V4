import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import ForgeButton from '@/components/ui/forge/ForgeButton';
import GoogleSignInButton from '@/components/ui/GoogleSignInButton';
import Icon from '@/components/AppIcon';
import { useTranslation } from 'react-i18next';
import { debug } from '@/lib/debug';

const createRegistrationSchema = (t) => z.object({
  firstName: z.string().min(1, t('registrationForm.firstNameRequired')),
  lastName: z.string().min(1, t('registrationForm.lastNameRequired')),
  email: z.string().email(t('registrationForm.emailInvalid')),
  password: z.string().min(6, t('registrationForm.passwordMinLength')),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: t('registrationForm.agreeTermsRequired'),
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: t('registrationForm.passwordsDoNotMatch'),
  path: ['confirmPassword'],
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

const errorTextStyle = {
  fontSize: '11px',
  color: 'var(--forge-error)',
  marginTop: '4px',
  fontFamily: 'var(--forge-font-body)',
};

const RegistrationForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registrationSchema = createRegistrationSchema(t);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '',
      password: '', confirmPassword: '',
      agreeTerms: false,
    }
  });

  const onSubmit = async (data) => {
    try {
      await authRegister(data.email, data.password, {
        displayName: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      navigate('/admin', { replace: true });
    } catch (error) {
      let errorMessage = t('registrationForm.genericError');
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('registrationForm.emailInUseError');
        setError('email', { type: 'manual', message: errorMessage });
      } else {
        setError('root.serverError', { type: 'manual', message: errorMessage });
      }
      debug("Registration error:", error);
    }
  };

  const handleGoogleSuccess = () => {
    navigate('/admin', { replace: true });
  };

  const handleGoogleError = (err) => {
    if (err?.code === 'auth/popup-closed-by-user') return;
    debug('Google registration error:', err);

    const msg = err?.code === 'auth/account-exists-with-different-credential'
      ? t('registrationForm.accountExistsError', 'Tento ucet je jiz registrovan jinou metodou.')
      : t('registrationForm.genericError');

    setError('root.serverError', { type: 'manual', message: msg });
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--forge-accent-primary)';
    e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'var(--forge-border-default)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div>
      {/* Google Sign-Up (top) */}
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        label={t('registrationForm.signUpWithGoogle', 'Sign up with Google')}
        disabled={isSubmitting}
      />

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
          {t('registrationForm.orEmail', 'or with email')}
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--forge-border-default)' }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

        {/* Name fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>{t('registrationForm.firstNameLabel')} *</label>
            <input
              type="text"
              placeholder={t('registrationForm.firstNamePlaceholder')}
              {...register('firstName')}
              disabled={isSubmitting}
              style={{
                ...inputStyle,
                borderColor: errors.firstName ? 'var(--forge-error)' : 'var(--forge-border-default)',
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {errors.firstName?.message && <div style={errorTextStyle}>{errors.firstName.message}</div>}
          </div>
          <div>
            <label style={labelStyle}>{t('registrationForm.lastNameLabel')} *</label>
            <input
              type="text"
              placeholder={t('registrationForm.lastNamePlaceholder')}
              {...register('lastName')}
              disabled={isSubmitting}
              style={{
                ...inputStyle,
                borderColor: errors.lastName ? 'var(--forge-error)' : 'var(--forge-border-default)',
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            {errors.lastName?.message && <div style={errorTextStyle}>{errors.lastName.message}</div>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>{t('registrationForm.emailLabel')} *</label>
          <input
            type="email"
            placeholder={t('registrationForm.emailPlaceholder')}
            {...register('email')}
            disabled={isSubmitting}
            style={{
              ...inputStyle,
              borderColor: errors.email ? 'var(--forge-error)' : 'var(--forge-border-default)',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          {errors.email?.message && <div style={errorTextStyle}>{errors.email.message}</div>}
        </div>

        {/* Password */}
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>{t('registrationForm.passwordLabel')} *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('registrationForm.passwordPlaceholder')}
            {...register('password')}
            disabled={isSubmitting}
            style={{
              ...inputStyle,
              paddingRight: '40px',
              borderColor: errors.password ? 'var(--forge-error)' : 'var(--forge-border-default)',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute', right: '12px', top: '32px',
              background: 'none', border: 'none', padding: '4px',
              color: 'var(--forge-text-muted)', cursor: 'pointer',
            }}
          >
            <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
          </button>
          {errors.password?.message && <div style={errorTextStyle}>{errors.password.message}</div>}
        </div>

        {/* Confirm Password */}
        <div style={{ position: 'relative' }}>
          <label style={labelStyle}>{t('registrationForm.confirmPasswordLabel')} *</label>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('registrationForm.confirmPasswordPlaceholder')}
            {...register('confirmPassword')}
            disabled={isSubmitting}
            style={{
              ...inputStyle,
              paddingRight: '40px',
              borderColor: errors.confirmPassword ? 'var(--forge-error)' : 'var(--forge-border-default)',
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: 'absolute', right: '12px', top: '32px',
              background: 'none', border: 'none', padding: '4px',
              color: 'var(--forge-text-muted)', cursor: 'pointer',
            }}
          >
            <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} size={18} />
          </button>
          {errors.confirmPassword?.message && <div style={errorTextStyle}>{errors.confirmPassword.message}</div>}
        </div>

        {/* Terms */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            {...register('agreeTerms')}
            disabled={isSubmitting}
            style={{ accentColor: 'var(--forge-accent-primary)', marginTop: '3px', flexShrink: 0 }}
          />
          <span style={{ fontSize: '13px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)', lineHeight: 1.4 }}>
            {t('registrationForm.agreeTermsPrefix')}{' '}
            <Link to="/terms" style={{ color: 'var(--forge-accent-primary)', textDecoration: 'none' }}>{t('registrationForm.termsAndConditions')}</Link>
            {' '}{t('registrationForm.and')}{' '}
            <Link to="/privacy" style={{ color: 'var(--forge-accent-primary)', textDecoration: 'none' }}>{t('registrationForm.privacyPolicy')}</Link> *
          </span>
        </label>
        {errors.agreeTerms?.message && <div style={errorTextStyle}>{errors.agreeTerms.message}</div>}

        {/* Submit */}
        <ForgeButton
          variant="primary"
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', height: '48px', marginTop: '8px' }}
        >
          {isSubmitting ? t('registrationForm.creatingAccount') : t('registrationForm.createAccountButton')}
        </ForgeButton>
      </form>

      {/* Login link */}
      <div style={{
        textAlign: 'center',
        paddingTop: '16px',
        borderTop: '1px solid var(--forge-border-default)',
        marginTop: '20px',
      }}>
        <p style={{
          fontSize: '13px',
          color: 'var(--forge-text-muted)',
          fontFamily: 'var(--forge-font-body)',
        }}>
          {t('registrationForm.alreadyHaveAccount')}{' '}
          <Link to="/login" style={{ color: 'var(--forge-accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
            {t('registrationForm.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegistrationForm;
