import { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Button,
} from "react-native";
import { SettingsContext } from "../context/SettingsContext";
import { t, getLocale, setLocale } from "../i18n";

const API_BASE = "http://172.16.206.42:4000";

export default function SettingsScreen({ navigation }) {
  const { theme, fontSize, setTheme, setFontSize } = useContext(SettingsContext);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState(getLocale()); // Use getLocale() for initial language

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

  const changeLanguage = (lang) => {
    setLocale(lang); // Update the locale globally
    setLanguage(getLocale()); // Update state with the new locale
    Alert.alert(t("success"), t("language_changed")); // Notify user of language change
  };

  const handleUpdate = async () => {
    try {
      if (!currentPassword) {
        Alert.alert("Erreur", "Mot de passe actuel requis");
        return;
      }
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username || undefined,
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert("Erreur", data.error || "Impossible de modifier");
        return;
      }
      await SecureStore.setItemAsync("token", data.token);
      onTokenUpdate(data.token);
      Alert.alert("Succès", "Paramètres mis à jour");
      setUsername("");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      Alert.alert("Erreur réseau", "Impossible de joindre l'API");
    } finally {
      setLoading(false);
    }
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
            onPress={() => setTheme(key)}
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
            onPress={() => setFontSize(key)}
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