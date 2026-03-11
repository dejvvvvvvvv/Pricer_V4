import "./i18n"; // Import the i18n configuration
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/tailwind.css";
import "./styles/index.css";
import { ActiveAuthProvider } from "./providers";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppProvider } from "./contexts/AppContext";

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
