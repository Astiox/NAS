import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as SecureStore from "expo-secure-store";

const API_BASE = "http://172.16.206.42:4000";

export default function SettingsScreen({ token, onTokenUpdate, navigation }) {
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("");
  const [fontSize, setFontSize] = useState("");
  const [logoSize, setLogoSize] = useState("");

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

  const navigateToChangeCredentials = () => {
    navigation.navigate("ChangeCredentials");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personnalisation</Text>
        <TextInput
          style={styles.input}
          placeholder="Couleur principale (ex: #007AFF)"
          value={primaryColor}
          onChangeText={setPrimaryColor}
        />
        <TextInput
          style={styles.input}
          placeholder="Taille de police (ex: 16)"
          value={fontSize}
          onChangeText={setFontSize}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Taille du logo (ex: 48)"
          value={logoSize}
          onChangeText={setLogoSize}
          keyboardType="numeric"
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Changer Identifiants</Text>
        <Button title="Modifier Identifiants" onPress={navigateToChangeCredentials} />
      </View>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
});