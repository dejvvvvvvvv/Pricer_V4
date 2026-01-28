
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '@/firebase'; 
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import Icon from '@/components/AppIcon';
import { useTranslation } from 'react-i18next';

// Funkce pro generování schématu v závislosti na roli a překladové funkci t
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
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
        agreeMarketing: false,
        companyName: '',
        businessId: '',
        city: '',
        postalCode: '',
        address: '',
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
        // Conditionally add host-specific data
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

      // Navigate to the appropriate dashboard after successful registration
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errors.root?.serverError && <p className="text-red-500 text-center mb-4">{errors.root.serverError.message}</p>}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="User" size={20} />
          <span>{t('registrationForm.personalDetails')}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label={t('registrationForm.firstNameLabel') + ' *'}
            placeholder={t('registrationForm.firstNamePlaceholder')}
            error={errors.firstName?.message}
            required
          />
          <Input
             {...register('lastName')}
            label={t('registrationForm.lastNameLabel') + ' *'}
            placeholder={t('registrationForm.lastNamePlaceholder')}
            error={errors.lastName?.message}
            required
          />
        </div>

        <Input
            {...register('email')}
            label={t('registrationForm.emailLabel') + ' *'}
            type="email"
            placeholder={t('registrationForm.emailPlaceholder')}
            error={errors.email?.message}
            required
        />
        <Input
            {...register('phone')}
            label={t('registrationForm.phoneLabel')}
            type="tel"
            placeholder="+420 123 456 789"
            error={errors.phone?.message}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="Lock" size={20} />
          <span>{t('registrationForm.security')}</span>
        </h3>

        <div className="relative">
          <Input
             {...register('password')}
            label={t('registrationForm.passwordLabel') + ' *'}
            type={showPassword ? "text" : "password"}
            placeholder={t('registrationForm.passwordPlaceholder')}
            error={errors.password?.message}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors">
            <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
          </button>
        </div>

        <div className="relative">
          <Input
            {...register('confirmPassword')}
            label={t('registrationForm.confirmPasswordLabel') + ' *'}
            type={showConfirmPassword ? "text" : "password"}
            placeholder={t('registrationForm.confirmPasswordPlaceholder')}
            error={errors.confirmPassword?.message}
            required
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors">
            <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} size={18} />
          </button>
        </div>
      </div>
      
      {selectedRole === 'host' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
            <Icon name="Building" size={20} />
            <span>{t('registrationForm.businessInfo')}</span>
          </h3>
          <Input {...register('companyName')} label={t('registrationForm.companyNameLabel')} error={errors.companyName?.message} />
          <Input {...register('businessId')} label={t('registrationForm.businessIdLabel')} error={errors.businessId?.message} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input {...register('city')} label={t('registrationForm.cityLabel') + ' *'} error={errors.city?.message} required />
            <Input {...register('postalCode')} label={t('registrationForm.postalCodeLabel') + ' *'} error={errors.postalCode?.message} required />
          </div>
          <Input {...register('address')} label={t('registrationForm.addressLabel') + ' *'} error={errors.address?.message} required />
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
          <Icon name="FileText" size={20} />
          <span>{t('registrationForm.legalAgreements')}</span>
        </h3>
        <Checkbox
           {...register('agreeTerms')}
          label={
            <span className="text-sm">
              {t('registrationForm.agreeTermsPrefix')} <Link to="/terms" className="text-primary hover:underline">{t('registrationForm.termsAndConditions')}</Link> {t('registrationForm.and')} <Link to="/privacy" className="text-primary hover:underline">{t('registrationForm.privacyPolicy')}</Link> *
            </span>
          }
          error={errors.agreeTerms?.message}
          required
        />
        <Checkbox {...register('agreeMarketing')} label={t('registrationForm.agreeMarketing')} />
        {selectedRole === 'host' && (
          <Checkbox
             {...register('confirmEquipment')}
            label={t('registrationForm.confirmEquipment')}
            error={errors.confirmEquipment?.message}
            required
          />
        )}
      </div>

      <div className="pt-4">
        <Button type="submit" variant="default" size="lg" fullWidth loading={isSubmitting} iconName="UserPlus" iconPosition="left">
          {isSubmitting ? t('registrationForm.creatingAccount') : t('registrationForm.createAccountButton')}
        </Button>
      </div>
      
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          {t('registrationForm.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            {t('registrationForm.loginLink')}
          </Link>
        </p>
      </div>
    </form>
  );
};

export default RegistrationForm;
