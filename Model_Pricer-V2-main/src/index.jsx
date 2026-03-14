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
// These are logged in development; in production you would send to an error
// tracking service (Sentry, etc.) here.
window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('[UnhandledRejection]', event.reason);
  // Prevent the default browser console warning being doubled.
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  // Ignore ResizeObserver loop errors — benign browser behaviour.
  if (event.message && event.message.includes('ResizeObserver loop')) return;
  // eslint-disable-next-line no-console
  console.error('[GlobalError]', event.message, event.error);
});
