import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '@/firebase';
import ForgeButton from '@/components/ui/forge/ForgeButton';
import Icon from '@/components/AppIcon';
import { useTranslation } from 'react-i18next';

const createRegistrationSchema = (t, role) => {
  let schema = z.object({
    firstName: z.string().min(1, t('registrationForm.firstNameRequired')),
    lastName: z.string().min(1, t('registrationForm.lastNameRequired')),
    email: z.string().email(t('registrationForm.emailInvalid')),
    phone: z.string().optional(),
    password: z.string().min(6, t('registrationForm.passwordMinLength')),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine(val => val === true, {
      message: t('registrationForm.agreeTermsRequired'),
    }),
    agreeMarketing: z.boolean().optional(),
    companyName: z.string().optional(),
    businessId: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
    address: z.string().optional(),
    confirmEquipment: z.boolean().optional(),
  }).refine(data => data.password === data.confirmPassword, {
    message: t('registrationForm.passwordsDoNotMatch'),
    path: ["confirmPassword"],
  });

  if (role === 'host') {
    schema = schema.extend({
      city: z.string().min(1, t('registrationForm.cityRequired')),
      postalCode: z.string().min(1, t('registrationForm.postalCodeRequired')),
      address: z.string().min(1, t('registrationForm.addressRequired')),
      confirmEquipment: z.boolean().refine(val => val === true, {
        message: t('registrationForm.confirmEquipmentRequired'),
      }),
    });
  }

  return schema;
};

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

const sectionHeadingStyle = {
  fontFamily: 'var(--forge-font-tech)',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--forge-text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '16px',
};

const RegistrationForm = ({ selectedRole }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registrationSchema = createRegistrationSchema(t, selectedRole);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      password: '', confirmPassword: '',
      agreeTerms: false, agreeMarketing: false,
      companyName: '', businessId: '', city: '', postalCode: '', address: '',
      confirmEquipment: false,
    }
  });

  const onSubmit = async (data) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || '',
        role: selectedRole,
        createdAt: new Date(),
        ...(selectedRole === 'host' && {
          companyName: data.companyName || '',
          businessId: data.businessId || '',
          address: {
            city: data.city,
            postalCode: data.postalCode,
            street: data.address,
          },
        })
      };

      await setDoc(doc(db, "users", user.uid), userData);

      if (selectedRole === 'host') {
        navigate('/host-dashboard');
      } else {
        navigate('/customer-dashboard');
      }

    } catch (error) {
      let errorMessage = t('registrationForm.genericError');
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('registrationForm.emailInUseError');
        setError('email', { type: 'manual', message: errorMessage });
      } else {
        setError('root.serverError', { type: 'manual', message: errorMessage });
      }
      console.error("Firebase registration error:", error);
    }
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = 'var(--forge-accent-primary)';
    e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
  };

  const handleBlur = (e) => {
    e.target.style.borderColor = 'var(--forge-border-default)';
    e.target.style.boxShadow = 'none';
  };

  const renderInput = (name, label, type = 'text', placeholder = '', required = false) => (
    <div>
      <label style={labelStyle}>{label}{required ? ' *' : ''}</label>
      <input
        type={type}
        placeholder={placeholder}
        {...register(name)}
        disabled={isSubmitting}
        style={{
          ...inputStyle,
          borderColor: errors[name] ? 'var(--forge-error)' : 'var(--forge-border-default)',
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {errors[name]?.message && <div style={errorTextStyle}>{errors[name].message}</div>}
    </div>
  );

  const renderPasswordInput = (name, label, show, setShow, placeholder) => (
    <div style={{ position: 'relative' }}>
      <label style={labelStyle}>{label} *</label>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        {...register(name)}
        disabled={isSubmitting}
        style={{
          ...inputStyle,
          paddingRight: '40px',
          borderColor: errors[name] ? 'var(--forge-error)' : 'var(--forge-border-default)',
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          position: 'absolute', right: '12px', top: '32px',
          background: 'none', border: 'none', padding: '4px',
          color: 'var(--forge-text-muted)', cursor: 'pointer',
        }}
      >
        <Icon name={show ? 'EyeOff' : 'Eye'} size={18} />
      </button>
      {errors[name]?.message && <div style={errorTextStyle}>{errors[name].message}</div>}
    </div>
  );

  const renderCheckbox = (name, label, required = false) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        {...register(name)}
        disabled={isSubmitting}
        style={{ accentColor: 'var(--forge-accent-primary)', marginTop: '3px', flexShrink: 0 }}
      />
      <span style={{ fontSize: '13px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)', lineHeight: 1.4 }}>
        {label}
      </span>
      {errors[name]?.message && <div style={errorTextStyle}>{errors[name].message}</div>}
    </label>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {errors.root?.serverError && (
        <p style={{ color: 'var(--forge-error)', textAlign: 'center', fontSize: '13px', fontFamily: 'var(--forge-font-body)' }}>
          {errors.root.serverError.message}
        </p>
      )}

      {/* Personal Details */}
      <div>
        <h3 style={sectionHeadingStyle}>
          <Icon name="User" size={18} style={{ color: 'var(--forge-text-muted)' }} />
          {t('registrationForm.personalDetails')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {renderInput('firstName', t('registrationForm.firstNameLabel'), 'text', t('registrationForm.firstNamePlaceholder'), true)}
          {renderInput('lastName', t('registrationForm.lastNameLabel'), 'text', t('registrationForm.lastNamePlaceholder'), true)}
        </div>
        {renderInput('email', t('registrationForm.emailLabel'), 'email', t('registrationForm.emailPlaceholder'), true)}
        <div style={{ marginTop: '16px' }}>
          {renderInput('phone', t('registrationForm.phoneLabel'), 'tel', '+420 123 456 789')}
        </div>
      </div>

      {/* Security */}
      <div>
        <h3 style={sectionHeadingStyle}>
          <Icon name="Lock" size={18} style={{ color: 'var(--forge-text-muted)' }} />
          {t('registrationForm.security')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {renderPasswordInput('password', t('registrationForm.passwordLabel'), showPassword, setShowPassword, t('registrationForm.passwordPlaceholder'))}
          {renderPasswordInput('confirmPassword', t('registrationForm.confirmPasswordLabel'), showConfirmPassword, setShowConfirmPassword, t('registrationForm.confirmPasswordPlaceholder'))}
        </div>
      </div>

      {/* Business Info (host only) */}
      {selectedRole === 'host' && (
        <div>
          <h3 style={sectionHeadingStyle}>
            <Icon name="Building" size={18} style={{ color: 'var(--forge-text-muted)' }} />
            {t('registrationForm.businessInfo')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {renderInput('companyName', t('registrationForm.companyNameLabel'))}
            {renderInput('businessId', t('registrationForm.businessIdLabel'))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {renderInput('city', t('registrationForm.cityLabel'), 'text', '', true)}
              {renderInput('postalCode', t('registrationForm.postalCodeLabel'), 'text', '', true)}
            </div>
            {renderInput('address', t('registrationForm.addressLabel'), 'text', '', true)}
          </div>
        </div>
      )}

      {/* Legal Agreements */}
      <div>
        <h3 style={sectionHeadingStyle}>
          <Icon name="FileText" size={18} style={{ color: 'var(--forge-text-muted)' }} />
          {t('registrationForm.legalAgreements')}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

          {renderCheckbox('agreeMarketing', t('registrationForm.agreeMarketing'))}

          {selectedRole === 'host' && renderCheckbox('confirmEquipment', t('registrationForm.confirmEquipment'), true)}
        </div>
      </div>

      {/* Submit */}
      <div style={{ paddingTop: '8px' }}>
        <ForgeButton
          variant="primary"
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', height: '48px' }}
        >
          {isSubmitting ? t('registrationForm.creatingAccount') : t('registrationForm.createAccountButton')}
        </ForgeButton>
      </div>

      {/* Login Link */}
      <div style={{
        textAlign: 'center',
        paddingTop: '16px',
        borderTop: '1px solid var(--forge-border-default)',
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
    </form>
  );
};

export default RegistrationForm;
