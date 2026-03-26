
import * as SecureStore from "expo-secure-store";
import { createContext, useEffect, useState } from "react";

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setThemeState] = useState("default");
  const [fontSize, setFontSizeState] = useState("medium");

  const themes = {
    default: { backgroundColor: "#fff", textColor: "#000" },
    light: { backgroundColor: "#fff", textColor: "#000" },
    dark: { backgroundColor: "#000", textColor: "#fff" },
    blue: { backgroundColor: "#007AFF", textColor: "#fff" },
    green: { backgroundColor: "#4CAF50", textColor: "#fff" },
    red: { backgroundColor: "#F44336", textColor: "#fff" },
    brown: { backgroundColor: "#8B4513", textColor: "#F5F5DC" },
  };

  const fontSizes = {
    small: 14,
    medium: 18,
    large: 22,
  };

  const normalizeTheme = (value) => {
    if (!value || typeof value !== "string") {
      return "default";
    }

    const normalized = value.trim().toLowerCase();
    return themes[normalized] ? normalized : "default";
  };

  const normalizeFontSize = (value) => {
    if (!value || typeof value !== "string") {
      return "medium";
    }

    const normalized = value.trim().toLowerCase();
    return fontSizes[normalized] ? normalized : "medium";
  };

  // Load settings from SecureStore on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync("localTheme");
        const savedFontSize = await SecureStore.getItemAsync("localFontSize");

        console.log("[SettingsProvider] Loading from SecureStore");
        console.log("[SettingsProvider] savedTheme:", savedTheme);
        console.log("[SettingsProvider] savedFontSize:", savedFontSize);

        if (savedTheme) {
          setThemeState(normalizeTheme(savedTheme));
        }
        if (savedFontSize) {
          setFontSizeState(normalizeFontSize(savedFontSize));
        }
      } catch (error) {
        console.log("[SettingsProvider] Error loading settings:", error.message);
      }
    };
    loadSettings();
  }, []);

  const setTheme = (newTheme) => {
    const normalizedTheme = normalizeTheme(newTheme);
    console.log("[SettingsProvider] setTheme:", normalizedTheme);
    setThemeState(normalizedTheme);
    // Save to SecureStore (fire and forget)
    SecureStore.setItemAsync("localTheme", normalizedTheme).catch((error) => {
      console.log("[SettingsProvider] Error saving theme:", error.message);
    });
  };

  const setFontSize = (newFontSize) => {
    const normalizedFontSize = normalizeFontSize(newFontSize);
    console.log("[SettingsProvider] setFontSize:", normalizedFontSize);
    setFontSizeState(normalizedFontSize);
    // Save to SecureStore (fire and forget)
    SecureStore.setItemAsync("localFontSize", normalizedFontSize).catch((error) => {
      console.log("[SettingsProvider] Error saving fontSize:", error.message);
    });
  };

  const value = {
    theme: themes[normalizeTheme(theme)],
    fontSize: fontSizes[normalizeFontSize(fontSize)],
    setTheme,
    setFontSize,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
