import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
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
       Alert.alert("Erreur", "Token non reçu");
     }
   } catch (error) {
     Alert.alert("Erreur", "Une erreur s'est produite");
   } finally {
     setLoading(false);
   }
 };

 return (
   <View style={styles.container}>
     <View style={styles.logoContainer}>
       <Text style={styles.logo}>🔒 NAS</Text>
     </View>
     <View style={styles.form}>
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
       <TouchableOpacity
         style={[styles.button, loading && styles.buttonDisabled]}
         onPress={handleLogin}
         disabled={loading}
       >
         <Text style={styles.buttonText}>{loading ? "Connexion..." : "Se connecter"}</Text>
       </TouchableOpacity>
     </View>
   </View>
 );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#007AFF",
  },
  form: {
    width: "85%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});