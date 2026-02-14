import { z } from 'zod';

export function getCheckoutSchema(language = 'cs') {
  const t = (cs, en) => (language === 'en' ? en : cs);

  return z.object({
    name: z
      .string()
      .min(2, t('Jmeno musi mit alespon 2 znaky', 'Name must be at least 2 characters'))
      .max(100, t('Jmeno je prilis dlouhe', 'Name is too long')),

    email: z
      .string()
      .min(1, t('Email je povinny', 'Email is required'))
      .email(t('Neplatny format emailu', 'Invalid email format')),

    phone: z
      .string()
      .max(20, t('Telefon je prilis dlouhy', 'Phone is too long'))
      .optional()
      .or(z.literal('')),

    company: z
      .string()
      .max(100, t('Nazev firmy je prilis dlouhy', 'Company name is too long'))
      .optional()
      .or(z.literal('')),

    // Shipping address
    street: z
      .string()
      .min(2, t('Ulice je povinna', 'Street is required'))
      .max(200, t('Ulice je prilis dlouha', 'Street is too long')),

    city: z
      .string()
      .min(1, t('Mesto je povinne', 'City is required'))
      .max(100, t('Mesto je prilis dlouhe', 'City is too long')),

    zip: z
      .string()
      .min(3, t('PSC je povinne', 'ZIP code is required'))
      .max(10, t('PSC je prilis dlouhe', 'ZIP code is too long')),

    country: z
      .string()
      .min(1, t('Stat je povinny', 'Country is required'))
      .max(100, t('Stat je prilis dlouhy', 'Country is too long')),

    note: z
      .string()
      .max(1000, t('Poznamka je prilis dlouha', 'Note is too long'))
      .optional()
      .or(z.literal('')),

    gdprConsent: z
      .boolean()
      .refine((v) => v === true, {
        message: t(
          'Souhlas se zpracovanim osobnich udaju je povinny',
          'You must consent to the processing of personal data'
        ),
      }),
  });
}
