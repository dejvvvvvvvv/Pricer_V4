import { z } from 'zod';

export function getCheckoutSchema(language = 'cs') {
  const t = (cs, en) => (language === 'en' ? en : cs);

  return z.object({
    name: z
      .string()
      .min(1, t('Jmeno je povinne', 'Name is required'))
      .min(2, t('Jmeno musi mit alespon 2 znaky', 'Name must be at least 2 characters'))
      .max(100, t('Jmeno je prilis dlouhe', 'Name is too long')),

    email: z
      .string()
      .min(1, t('Email je povinny', 'Email is required'))
      .trim()
      .email(t('Neplatny format emailu', 'Invalid email format')),

    phone: z
      .string()
      .max(30, t('Telefon je prilis dlouhy', 'Phone is too long'))
      .refine(
        (val) => !val || /^[+]?[\d\s\-().]{7,30}$/.test(val),
        t('Neplatny format telefonu', 'Invalid phone format')
      )
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

    // Billing address toggle
    billingAddressSameAsShipping: z.boolean().default(true),

    // Billing address fields (optional — only validated when billingAddressSameAsShipping is false)
    billingStreet: z
      .string()
      .max(200, t('Ulice je prilis dlouha', 'Street is too long'))
      .optional()
      .or(z.literal('')),

    billingCity: z
      .string()
      .max(100, t('Mesto je prilis dlouhe', 'City is too long'))
      .optional()
      .or(z.literal('')),

    billingZip: z
      .string()
      .max(10, t('PSC je prilis dlouhe', 'ZIP code is too long'))
      .optional()
      .or(z.literal('')),

    billingCountry: z
      .string()
      .max(100, t('Stat je prilis dlouhy', 'Country is too long'))
      .optional()
      .or(z.literal('')),

    // Company purchase toggle
    isCompanyPurchase: z.boolean().default(false),

    // Company fields (optional — only validated when isCompanyPurchase is true)
    companyName: z
      .string()
      .max(200, t('Nazev firmy je prilis dlouhy', 'Company name is too long'))
      .optional()
      .or(z.literal('')),

    ico: z
      .string()
      .max(20, t('ICO je prilis dlouhe', 'Company ID is too long'))
      .optional()
      .or(z.literal('')),

    dic: z
      .string()
      .max(20, t('DIC je prilis dlouhe', 'VAT ID is too long'))
      .optional()
      .or(z.literal('')),

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

    payment_method: z.enum(['bank_transfer', 'card']).default('bank_transfer'),
  }).superRefine((data, ctx) => {
    // Validate billing address fields when not same as shipping
    if (!data.billingAddressSameAsShipping) {
      if (!data.billingStreet || data.billingStreet.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Fakturacni ulice je povinna', 'Billing street is required'),
          path: ['billingStreet'],
        });
      }
      if (!data.billingCity || data.billingCity.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Fakturacni mesto je povinne', 'Billing city is required'),
          path: ['billingCity'],
        });
      }
      if (!data.billingZip || data.billingZip.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Fakturacni PSC je povinne', 'Billing ZIP is required'),
          path: ['billingZip'],
        });
      }
      if (!data.billingCountry || data.billingCountry.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Fakturacni stat je povinny', 'Billing country is required'),
          path: ['billingCountry'],
        });
      }
    }

    // Validate company fields when company purchase is checked
    if (data.isCompanyPurchase) {
      if (!data.companyName || data.companyName.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Nazev firmy je povinny', 'Company name is required'),
          path: ['companyName'],
        });
      }
      if (!data.ico || data.ico.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('ICO je povinne', 'Company ID is required'),
          path: ['ico'],
        });
      }
      // ICO/Company ID validation: 5-15 alphanumeric characters (supports CZ 8-digit and international formats)
      if (data.ico && data.ico.length > 0 && !/^[A-Za-z0-9]{5,15}$/.test(data.ico)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('Neplatne ICO / Company ID', 'Neplatné IČO / Company ID'),
          path: ['ico'],
        });
      }
    }
  });
}
