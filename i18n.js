import * as Localization from "expo-localization";

const translations = {
  en: {
    settings: "Settings",
    language_changed: "Language changed successfully",
    current_language: "Current language",
    french: "French",
    english: "English",
    logout: "Logout",
    upload: "Upload",
    back: "Back",
    error: "Error",
    success: "Success",
    fill_username_password: "Please fill in username and password",
    setup_failed: "Setup failed",
    account_created: "Account created",
    network_error: "Network Error",
    api_unreachable: "Unable to reach the API",
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
    logout: "Déconnexion",
    upload: "Téléverser",
    back: "Retour",
    error: "Erreur",
    success: "Succès",
    fill_username_password: "Veuillez remplir le nom d'utilisateur et le mot de passe",
    setup_failed: "Échec de la configuration",
    account_created: "Compte créé",
    network_error: "Erreur réseau",
    api_unreachable: "Impossible de joindre l'API",
    initial_setup: "Première configuration",
    username_placeholder: "Nom d'utilisateur",
    password_placeholder: "Mot de passe",
    creating_account: "Création...",
    create_account: "Créer le compte",
  },
};

let currentLocale = "en";

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
currentLocale = detectLocale();

// Get the current locale
const getLocale = () => currentLocale;

// Set the current locale
const setLocale = (locale) => {
  if (translations[locale]) {
    currentLocale = locale;
  }
};

// Translate a key
const t = (key) => translations[currentLocale]?.[key] || key;

export { t, getLocale, setLocale };