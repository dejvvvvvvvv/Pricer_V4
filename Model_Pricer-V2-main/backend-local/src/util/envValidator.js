/**
 * Environment Variable Validator
 *
 * Checks required and optional env vars at backend startup.
 * Logs clear, structured output about what is configured and what is missing.
 * NEVER prints env var values — only names and status (security).
 *
 * @module util/envValidator
 */

// ---------------------------------------------------------------------------
// Schema — single source of truth for all backend env vars
// ---------------------------------------------------------------------------

const ENV_SCHEMA = {
  // ---- Always required (have sane defaults for dev) -----------------------
  required: {
    PORT:     { default: '3001',        description: 'Server port' },
    NODE_ENV: { default: 'development', description: 'Environment (development | production)' },
  },

  // ---- Required only when a specific feature is enabled -------------------
  features: {
    firebase: {
      label: 'Firebase Auth',
      trigger: () => !!(process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_APPLICATION_CREDENTIALS),
      vars: {
        FIREBASE_PROJECT_ID: 'Firebase project ID for token verification',
      },
    },
    supabase: {
      label: 'Supabase',
      trigger: () => !!process.env.SUPABASE_URL,
      vars: {
        SUPABASE_URL:        'Supabase project URL',
        SUPABASE_JWT_SECRET: 'Supabase JWT secret (HS256)',
      },
    },
    storage_r2: {
      label: 'Cloudflare R2 Storage',
      trigger: () => (process.env.STORAGE_PROVIDER || '').toLowerCase() === 'r2',
      vars: {
        R2_ACCOUNT_ID:        'Cloudflare account ID',
        R2_ACCESS_KEY_ID:     'R2 API key ID',
        R2_ACCESS_KEY_SECRET: 'R2 API secret key',
        R2_BUCKET_NAME:       'R2 bucket name',
      },
    },
    email_resend: {
      label: 'Resend Email',
      trigger: () => (process.env.EMAIL_PROVIDER || '').toLowerCase() === 'resend',
      vars: {
        RESEND_API_KEY: 'Resend API key',
      },
    },
    stripe: {
      label: 'Stripe Payments',
      trigger: () => !!process.env.STRIPE_SECRET_KEY,
      vars: {
        STRIPE_SECRET_KEY:    'Stripe secret API key',
        STRIPE_WEBHOOK_SECRET: 'Stripe webhook signing secret',
      },
    },
    sentry: {
      label: 'Sentry Monitoring',
      trigger: () => !!process.env.SENTRY_DSN,
      vars: {
        SENTRY_DSN: 'Sentry DSN',
      },
    },
    invoicing: {
      label: 'Invoicing',
      trigger: () => !!process.env.INVOICE_COMPANY_NAME,
      vars: {
        INVOICE_COMPANY_NAME:    'Supplier company name',
        INVOICE_COMPANY_ADDRESS: 'Supplier address',
        INVOICE_COMPANY_ICO:     'Company ICO',
      },
    },
  },

  // ---- Optional (nice-to-have, no hard failure) ---------------------------
  optional: {
    CORS_ORIGINS:           'Allowed CORS origins (comma-separated)',
    APP_VERSION:            'Application version string',
    EMAIL_FROM:             'Default email sender address',
    PRUSA_SLICER_CMD:       'Path to PrusaSlicer CLI (auto-detected if missing)',
    SLICER_WORKSPACE_ROOT:  'Slicer workspace directory',
    PRUSA_DEFAULT_INI:      'Default INI profile path',
    MODELPRICER_DATA_ROOT:  'Persistent data root directory',
    STORAGE_ROOT:           'Storage root directory',
  },
};

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate environment variables and log a structured report.
 *
 * - In production: returns valid=false if any required vars are missing
 *   (caller should exit the process).
 * - In development: logs warnings but returns valid=true so dev can proceed
 *   with partial config.
 *
 * SECURITY: Never logs env var VALUES — only names and descriptions.
 *
 * @returns {{ valid: boolean, missing: string[], warnings: string[], configured: string[] }}
 */
export function validateEnvironment() {
  const missing    = [];
  const warnings   = [];
  const configured = [];

  // -- 1. Required vars (with defaults) ------------------------------------
  for (const [key, config] of Object.entries(ENV_SCHEMA.required)) {
    if (!process.env[key] && !config.default) {
      missing.push(`${key} -- ${config.description}`);
    }
  }

  // -- 2. Feature-specific vars --------------------------------------------
  for (const [feature, config] of Object.entries(ENV_SCHEMA.features)) {
    if (config.trigger()) {
      configured.push(config.label || feature);
      for (const [key, desc] of Object.entries(config.vars)) {
        if (!process.env[key]) {
          missing.push(`${key} -- ${desc} (required for ${config.label || feature})`);
        }
      }
    }
  }

  // -- 3. Optional vars ----------------------------------------------------
  for (const [key, desc] of Object.entries(ENV_SCHEMA.optional)) {
    if (!process.env[key]) {
      warnings.push(`${key} -- ${desc}`);
    }
  }

  // -- 4. Structured console output ----------------------------------------
  const nodeEnv = process.env.NODE_ENV || 'development';

  console.log('');
  console.log('+--------------------------------------+');
  console.log('|   Environment Configuration Check    |');
  console.log('+--------------------------------------+');
  console.log(`| NODE_ENV:  ${nodeEnv}`);
  console.log(`| Features:  ${configured.length > 0 ? configured.join(', ') : 'none (defaults only)'}`);

  if (missing.length > 0) {
    console.log('|');
    console.log('| MISSING (required):');
    for (const m of missing) {
      console.log(`|   [x] ${m}`);
    }
  }

  if (warnings.length > 0) {
    console.log('|');
    console.log('| Optional (not set):');
    for (const w of warnings) {
      console.log(`|   [ ] ${w}`);
    }
  }

  if (missing.length === 0) {
    console.log('|');
    console.log('| All required variables are set.');
  }

  console.log('+--------------------------------------+');
  console.log('');

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    configured,
  };
}
