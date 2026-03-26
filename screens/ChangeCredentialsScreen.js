import * as SecureStore from "expo-secure-store";
import { useContext, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { LARAVEL_API_BASE } from "../config";
import { SettingsContext } from "../context/SettingsContext";

export default function ChangeCredentialsScreen({ laravelToken, onTokenUpdate }) {
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
      
      console.log("[ChangeCredentialsScreen] Updating account");
      console.log("[ChangeCredentialsScreen] laravelToken exists:", !!laravelToken);
      
      const res = await fetch(`${LARAVEL_API_BASE}/account`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${laravelToken}`,
        },
        body: JSON.stringify({
          username: username || undefined,
          current_password: currentPassword,
          new_password: newPassword || undefined,
        }),
      });

      console.log("[ChangeCredentialsScreen] Account update response status:", res.status);
      const text = await res.text();
      console.log("[ChangeCredentialsScreen] Account update response body:", text);
      const data = JSON.parse(text);

      if (!res.ok) {
        Alert.alert("Erreur", data.error || data.message || "Impossible de modifier les identifiants");
        return;
      }

      if (data.token) {
        await SecureStore.setItemAsync("laravelToken", data.token);
        onTokenUpdate(data.token);
      }

      Alert.alert("Succès", "Identifiants mis à jour");
      setUsername("");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      console.log("[ChangeCredentialsScreen] Error:", error);
      Alert.alert("Erreur réseau", "Impossible de joindre le serveur Laravel");
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