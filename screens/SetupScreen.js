import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { useI18n } from "../context/I18nContext";
const API_BASE = "http://192.168.4.50:4000";
export default function SetupScreen({ onDone, navigation }) {
 const { t } = useI18n(); // Use the I18nContext
 const [username, setUsername] = useState("");
 const [password, setPassword] = useState("");
 const [loading, setLoading] = useState(false);
 const handleSetup = async () => {
   try {
     if (!username.trim() || !password.trim()) {
       Alert.alert(t("error"), t("fill_username_password"));
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
       Alert.alert(t("error"), data.error || t("setup_failed"));
       return;
     }
     Alert.alert(t("success"), t("account_created"));
     onDone();
   } catch (error) {
     Alert.alert(t("network_error"), t("api_unreachable"));
   } finally {
     setLoading(false);
   }
 };
 return (
<View style={styles.container}>
<Button title={`⬅ ${t("back")}`} onPress={() => navigation.goBack()} />
<Text style={styles.title}>{t("initial_setup")}</Text>
<TextInput
       style={styles.input}
       placeholder={t("username_placeholder")}
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
       placeholder={t("password_placeholder")}
       value={password}
       onChangeText={setPassword}
       secureTextEntry
       autoCorrect={false}
       autoComplete="off"
       textContentType="none"
       spellCheck={false}
     />
<Button
       title={loading ? t("creating_account") : t("create_account")}
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