import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from '@/firebase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import Icon from '@/components/AppIcon';
import { useTranslation } from 'react-i18next';

const createLoginSchema = (t) => z.object({
  email: z.string().email(t('loginForm.emailInvalid')),
  password: z.string().min(1, t('loginForm.passwordRequired')),
  rememberMe: z.boolean().optional(),
});

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

      // Fetch user role from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role || 'customer';

        // Redirect based on user role
        if (userRole === 'host') {
          navigate('/host-dashboard');
        } else {
          navigate('/customer-dashboard');
        }
      } else {
        // Fallback if user document doesn't exist
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

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label={t('loginForm.emailLabel')}
          type="email"
          placeholder="váš@email.cz"
          {...register('email')}
          error={errors.email?.message}
          required
          disabled={isSubmitting}
        />

        <Input
          label={t('loginForm.passwordLabel')}
          type="password"
          placeholder={t('loginForm.passwordPlaceholder')}
          {...register('password')}
          error={errors.password?.message}
          required
          disabled={isSubmitting}
        />

        <Checkbox
          label={t('loginForm.rememberMeLabel')}
          {...register('rememberMe')}
          disabled={isSubmitting}
        />

        {errors.root?.serverError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error flex items-center space-x-2">
              <Icon name="AlertCircle" size={16} />
              <span>{errors.root.serverError.message}</span>
            </p>
          </div>
        )}

        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
          iconName="LogIn"
          iconPosition="left"
        >
          {isSubmitting ? t('loginForm.loggingIn') : t('loginForm.loginButton')}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
