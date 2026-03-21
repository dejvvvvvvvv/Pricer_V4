import "./i18n"; // Import the i18n configuration
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import { ActiveAuthProvider } from "./providers";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppProvider } from "./contexts/AppContext";
import { registerServiceWorker } from "./lib/swRegister";
import { initSentry, captureException } from "./lib/sentry/sentryInit";

// Initialize Sentry (non-blocking — lazy-loads @sentry/react).
// If VITE_SENTRY_DSN is not set or @sentry/react is missing, this is a no-op.
initSentry();

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <LanguageProvider>
    <ActiveAuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </ActiveAuthProvider>
  </LanguageProvider>
);

// Register service worker for PWA support (production only)
registerServiceWorker();

// Global error handlers — catch unhandled promise rejections and synchronous
// errors that escape React's error boundary (e.g. in event handlers).
// Reports to Sentry when available, always logs to console in development.
window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('[UnhandledRejection]', event.reason);
  captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
    source: 'unhandledrejection',
  });
  // Prevent the default browser console warning being doubled.
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  // Ignore ResizeObserver loop errors — benign browser behaviour.
  if (event.message && event.message.includes('ResizeObserver loop')) return;
  // eslint-disable-next-line no-console
  console.error('[GlobalError]', event.message, event.error);
  if (event.error) {
    captureException(event.error, { source: 'window.onerror', message: event.message });
  }
});
