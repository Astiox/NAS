import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { SettingsContext } from "../context/SettingsContext";

const API_BASE = "http://192.168.4.50:4000";

export default function ChangeCredentialsScreen({ token, onTokenUpdate }) {
  const { theme, fontSize } = useContext(SettingsContext);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPassword) {
      Alert.alert("Erreur", "Mot de passe actuel requis");
      return;
    }
    
    try {
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

      // Real network error (fetch fails)
      if (!res) {
        Alert.alert("Erreur réseau", "Impossible de joindre l'API");
        return;
      }

      const data = await res.json();

      // Backend error (res.ok === false)
      if (!res.ok) {
        Alert.alert("Erreur", data.error || "Impossible de modifier les identifiants");
        return;
      }

      // Success response (res.ok === true)
      await SecureStore.setItemAsync("token", data.token);
      onTokenUpdate(data.token);
      Alert.alert("Succès", "Identifiants mis à jour");
      setUsername("");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      // Catch real network errors
      Alert.alert("Erreur réseau", "Impossible de joindre l'API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.title, { color: theme.textColor, fontSize }]}>Changer Identifiants</Text>
      <TextInput
        style={[styles.input, { color: theme.textColor }]}
        placeholder="Nouveau username (optionnel)"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        spellCheck={false}
      />
      <TextInput
        style={[styles.input, { color: theme.textColor }]}
        placeholder="Mot de passe actuel"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        spellCheck={false}
      />
      <TextInput
        style={[styles.input, { color: theme.textColor }]}
        placeholder="Nouveau mot de passe (optionnel)"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
        spellCheck={false}
      />
      <Button title={loading ? "Mise à jour..." : "Valider"} onPress={handleUpdate} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
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
});