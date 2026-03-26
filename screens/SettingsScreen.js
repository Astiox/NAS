import * as SecureStore from "expo-secure-store";
import { useContext, useEffect, useState } from "react";
import {
    Alert,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LARAVEL_API_BASE } from "../config";
import { SettingsContext } from "../context/SettingsContext";
import { getLocale, setLocale, t } from "../i18n";

export default function SettingsScreen({ navigation, laravelToken }) {
  const { theme, fontSize, setTheme, setFontSize } = useContext(SettingsContext);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getLocale());
  const [syncedSettings, setSyncedSettings] = useState(null);

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

  useEffect(() => {
    if (laravelToken) {
      fetchSettingsFromLaravel();
    }
  }, [laravelToken]);

  const fetchSettingsFromLaravel = async () => {
    try {
      console.log("[SettingsScreen] Fetching settings from Laravel");
      console.log("[SettingsScreen] laravelToken exists:", !!laravelToken);
      
      const res = await fetch(`${LARAVEL_API_BASE}/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${laravelToken}`,
        },
      });

      console.log("[SettingsScreen] Settings response status:", res.status);
      const text = await res.text();
      console.log("[SettingsScreen] Settings response body:", text);
      
      if (!res.ok) {
        console.log("Failed to fetch settings from Laravel");
        return;
      }

      const data = JSON.parse(text);
      if (data.settings) {
        setSyncedSettings(data.settings);
        await SecureStore.setItemAsync("settings", JSON.stringify(data.settings));
        
        // Apply theme and font size to local context
        console.log("[SettingsScreen] Applying settings to context");
        
        // Use backend theme directly (light, dark, blue, green, red, brown)
        const backendTheme = data.settings.theme;
        console.log("[SettingsScreen] Applying theme:", backendTheme);
        setTheme(backendTheme);

        // Map backend font_size to frontend font key
        const fontSize = data.settings.font_size;
        let fontKey = "medium";
        if (fontSize === 14) fontKey = "small";
        else if (fontSize === 18) fontKey = "medium";
        else if (fontSize === 22) fontKey = "large";
        console.log("[SettingsScreen] Mapping font_size:", fontSize, "->", fontKey);
        setFontSize(fontKey);

        // Update language
        if (data.settings.language) {
          setLocale(data.settings.language);
          setLanguage(getLocale());
          console.log("[SettingsScreen] Applied language:", data.settings.language);
        }
      }
    } catch (error) {
      console.log("Error fetching Laravel settings:", error.message);
    }
  };

  const syncSettingsToLaravel = async (updatedSettings) => {
    try {
      console.log("[SettingsScreen] Syncing settings to Laravel");
      console.log("[SettingsScreen] laravelToken exists:", !!laravelToken);
      console.log("[SettingsScreen] Payload before sync:", updatedSettings);
      
      const res = await fetch(`${LARAVEL_API_BASE}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${laravelToken}`,
        },
        body: JSON.stringify(updatedSettings),
      });

      console.log("[SettingsScreen] Sync response status:", res.status);
      const text = await res.text();
      console.log("[SettingsScreen] Sync response body:", text);

      if (!res.ok) {
        console.log("Failed to sync settings to Laravel");
        return false;
      }

      const data = JSON.parse(text);
      if (data.settings) {
        setSyncedSettings(data.settings);
        await SecureStore.setItemAsync("settings", JSON.stringify(data.settings));
      }
      return true;
    } catch (error) {
      console.log("Error syncing Laravel settings:", error.message);
      return false;
    }
  };

  const changeLanguage = (lang) => {
    setLocale(lang);
    setLanguage(getLocale());
    Alert.alert(t("success"), t("language_changed"));
    // Sync language preference to Laravel
    syncSettingsToLaravel({ language: lang });
  };

  const handleThemeChange = (themeKey) => {
    setTheme(themeKey);
    console.log("[SettingsScreen] Theme change:", themeKey);
    syncSettingsToLaravel({ theme: themeKey });
  };

  const handleFontSizeChange = (fontKey) => {
    setFontSize(fontKey);
    // Map frontend font key to backend integer value
    const fontSize = fontSizes[fontKey] || 18;
    console.log("[SettingsScreen] Font size change:", fontKey, "->", fontSize);
    syncSettingsToLaravel({ font_size: fontSize });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.title, { color: theme.textColor, fontSize }]}>{t("settings")}</Text>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{t("current_language")}</Text>
        <Text style={[styles.sectionText, { color: theme.textColor }]}>{t(language)}</Text>
        <Button title={t("french")} onPress={() => changeLanguage("fr")} />
        <Button title={t("english")} onPress={() => changeLanguage("en")} />
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Themes</Text>
        {Object.keys(themes).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.button, { borderColor: themes[key].backgroundColor }]}
            onPress={() => handleThemeChange(key)}
          >
            <Text style={[styles.buttonText, { color: themes[key].backgroundColor }]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Font Sizes</Text>
        {Object.keys(fontSizes).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.button, { borderColor: "#007AFF" }]}
            onPress={() => handleFontSizeChange(key)}
          >
            <Text style={[styles.buttonText, { color: "#007AFF" }]}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Changer Identifiants</Text>
        <TouchableOpacity
          style={[styles.button, { borderColor: theme.textColor }]}
          onPress={() => navigation.navigate("ChangeCredentials")}
        >
          <Text style={[styles.buttonText, { color: theme.textColor }]}>Modifier Identifiants</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  sectionText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#666",
  },
  button: {
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});