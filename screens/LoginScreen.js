import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LARAVEL_API_BASE } from "../config";

function safeParseJson(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("moussepi");
  const [password, setPassword] = useState("Secret");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      
      // 1. Login to Laravel
      console.log("[LoginScreen] Logging in to Laravel...");
      const laravelRes = await fetch(`${LARAVEL_API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      console.log("[LoginScreen] Laravel response status:", laravelRes.status);
      const rawBody = await laravelRes.text();
      console.log("[LoginScreen] Laravel raw response body:", rawBody);
      const laravelData = safeParseJson(rawBody);
      console.log("[LoginScreen] Laravel response:", laravelData);

      if (!laravelRes.ok) {
        Alert.alert("Erreur", laravelData?.error || laravelData?.message || "Login failed");
        return;
      }

      const laravelToken = laravelData?.token;
      if (!laravelToken) {
        Alert.alert("Erreur", "Laravel token not received");
        return;
      }

      // 2. Store Laravel session securely
      console.log("[LoginScreen] Storing tokens securely");
      await SecureStore.setItemAsync("laravelToken", laravelToken);
      await SecureStore.deleteItemAsync("nasToken");

      if (laravelData?.user) {
        await SecureStore.setItemAsync("user", JSON.stringify(laravelData.user));
      }
      if (laravelData?.settings) {
        await SecureStore.setItemAsync("settings", JSON.stringify(laravelData.settings));
      }

      // 3. Notify parent component
      console.log("[LoginScreen] Login successful, calling onLogin");
      onLogin(laravelToken, laravelData.user, laravelData.settings);
    } catch (error) {
      console.log("[LoginScreen] Error:", error.message);
      Alert.alert("Erreur réseau", "Impossible de joindre le serveur Laravel");
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
         autoCorrect={false}
         autoComplete="off"
         textContentType="none"
         spellCheck={false}
       />
       <TextInput
         style={styles.input}
         placeholder="Mot de passe"
         value={password}
         onChangeText={setPassword}
         secureTextEntry
         autoCorrect={false}
         autoComplete="off"
         textContentType="none"
         spellCheck={false}
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
