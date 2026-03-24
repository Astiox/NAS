import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
const API_BASE = "http://172.16.206.42:4000";
export default function SetupScreen({ onDone, navigation }) {
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const handleSetup = async () => {
   try {
     if (!username.trim() || !password.trim()) {
       Alert.alert("Erreur", "Remplis username et password");
       return;
     }
     setLoading(true);
     const res = await fetch(`${API_BASE}/auth/setup`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         username: username.trim(),
         password: password.trim(),
       }),
     });
     const data = await res.json();
     if (!res.ok) {
       Alert.alert("Erreur", data.error || "Setup impossible");
       return;
     }
     Alert.alert("OK", "Compte créé");
     onDone();
   } catch (error) {
     Alert.alert("Erreur réseau", "Impossible de joindre l'API");
   } finally {
     setLoading(false);
   }
 };
 return (
<View style={styles.container}>
<Button title="⬅ Retour" onPress={() => navigation.goBack()} />
<Text style={styles.title}>Première configuration</Text>
<TextInput
       style={styles.input}
       placeholder="Nom d'utilisateur"
       value={username}
       onChangeText={setUsername}
       autoCapitalize="none"
     />
<TextInput
       style={styles.input}
       placeholder="Mot de passe"
       value={password}
       onChangeText={setPassword}
       secureTextEntry
     />
<Button
       title={loading ? "Création..." : "Créer le compte"}
       onPress={handleSetup}
       disabled={loading}
     />
</View>
 );
}
const styles = StyleSheet.create({
 container: {
   flex: 1,
   justifyContent: "center",
   padding: 24,
   backgroundColor: "#fff",
 },
 title: {
   fontSize: 28,
   fontWeight: "bold",
   marginBottom: 24,
   textAlign: "center",
 },
 input: {
   borderWidth: 1,
   borderColor: "#ccc",
   padding: 12,
   marginBottom: 16,
   borderRadius: 8,
 },
});