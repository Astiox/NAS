
import React, { createContext, useContext, useState, useMemo } from "react";
import * as Localization from "expo-localization";

const translations = {
  en: {
    settings: "Settings",
    language_changed: "Language changed successfully",
    current_language: "Current language",
    french: "French",
    english: "English",
    error: "Error",
    fill_username_password: "Please fill in username and password",
    setup_failed: "Setup failed",
    success: "Success",
    account_created: "Account created",
    network_error: "Network Error",
    api_unreachable: "Unable to reach the API",
    back: "Back",
    initial_setup: "Initial Setup",
    username_placeholder: "Username",
    password_placeholder: "Password",
    creating_account: "Creating...",
    create_account: "Create Account",
  },
  fr: {
    settings: "Paramètres",
    language_changed: "Langue changée avec succès",
    current_language: "Langue actuelle",
    french: "Français",
    english: "Anglais",
    error: "Erreur",
    fill_username_password: "Remplis username et password",
    setup_failed: "Setup impossible",
    success: "OK",
    account_created: "Compte créé",
    network_error: "Erreur réseau",
    api_unreachable: "Impossible de joindre l'API",
    back: "Retour",
    initial_setup: "Première configuration",
    username_placeholder: "Nom d'utilisateur",
    password_placeholder: "Mot de passe",
    creating_account: "Création...",
    create_account: "Créer le compte",
  },
};

// Detect the initial locale
const detectLocale = () => {
  try {
    const locales = Localization.getLocales();
    const locale = locales?.[0]?.languageCode;
    if (locale && translations[locale]) {
      return locale;
    }
  } catch (error) {
    console.error("Error detecting locale:", error);
  }
  return "en"; // Default to English
};

// Create the context
const I18nContext = createContext();

// I18nProvider component
export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(detectLocale());

  const t = (key) => translations[locale]?.[key] || key;

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

// Custom hook to use the I18nContext
export const useI18n = () => useContext(I18nContext);