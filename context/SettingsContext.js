
import React, { createContext, useState } from "react";

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState("default");
  const [fontSize, setFontSize] = useState("medium");

  const themes = {
    default: { backgroundColor: "#fff", textColor: "#000" },
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

  const value = {
    theme: themes[theme],
    fontSize: fontSizes[fontSize],
    setTheme,
    setFontSize,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}