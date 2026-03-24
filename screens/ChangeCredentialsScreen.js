import { useState, useContext } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { SettingsContext } from "../context/SettingsContext";

const API_BASE = "http://172.16.206.42:4000";

export default function ChangeCredentialsScreen({ token, onTokenUpdate }) {
  const { theme, fontSize } = useContext(SettingsContext);
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      Alert.alert("Succès", "Identifiants mis à jour");
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
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Text style={[styles.title, { color: theme.textColor, fontSize }]}>Changer Identifiants</Text>
      <TextInput
        style={[styles.input, { color: theme.textColor }]}
        placeholder="Nouveau username (optionnel)"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={[styles.input, { color: theme.textColor }]}
        placeholder="Mot de passe actuel"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
      />
      <TextInput
        style={[styles.input, { color: theme.textColor }]}
        placeholder="Nouveau mot de passe (optionnel)"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
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