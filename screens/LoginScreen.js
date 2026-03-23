import { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
const API_BASE = "http://172.16.206.42:4000";
export default function LoginScreen({ onLogin }) {
 const [username, setUsername] = useState("moussepi");
 const [password, setPassword] = useState("Secret");
 const [loading, setLoading] = useState(false);
 const handleLogin = async () => {
   try {
     setLoading(true);
     const res = await fetch(`${API_BASE}/auth/login`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json"
       },
       body: JSON.stringify({
         username,
         password
       })
     });
     const data = await res.json();
     if (!res.ok) {
       Alert.alert("Erreur", data.error || "Login failed");
       return;
     }
     if (data.token) {
       onLogin(data.token);
     } else {
       Alert.alert("Erreur", "Token manquant");
     }
   } catch (error) {
     Alert.alert("Erreur réseau", "Impossible de joindre l'API");
   } finally {
     setLoading(false);
   }
 };
 return (
<View style={styles.container}>
<Text style={styles.title}>NAS Login</Text>
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
       title={loading ? "Connexion..." : "Se connecter"}
       onPress={handleLogin}
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
   backgroundColor: "#fff"
 },
 title: {
   fontSize: 28,
   fontWeight: "bold",
   marginBottom: 24,
   textAlign: "center"
 },
 input: {
   borderWidth: 1,
   borderColor: "#ccc",
   padding: 12,
   marginBottom: 16,
   borderRadius: 8
 }
});