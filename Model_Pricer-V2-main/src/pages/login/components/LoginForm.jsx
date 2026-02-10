import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from '@/firebase';
import ForgeButton from '@/components/ui/forge/ForgeButton';
import Icon from '@/components/AppIcon';
import { useTranslation } from 'react-i18next';

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

const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loginSchema = createLoginSchema(t);

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
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role || 'customer';

        if (userRole === 'host') {
          navigate('/host-dashboard');
        } else {
          navigate('/customer-dashboard');
        }
      } else {
        console.error("User document not found in Firestore!");
        navigate('/customer-dashboard');
      }

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
          console.error("Firebase login error:", error);
      }
      setError('root.serverError', { type: 'manual', message: errorMessage });
    }
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
        </div>

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
    </div>
  );
};

export default LoginForm;
