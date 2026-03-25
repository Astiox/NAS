import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SettingsProvider } from "./context/SettingsContext";
import { I18nProvider } from "./context/I18nContext";
import LoginScreen from "./screens/LoginScreen";
import SetupScreen from "./screens/SetupScreen";
import FileScreen from "./screens/FileScreen";
import FileDetailScreen from "./screens/FileDetailsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import ChangeCredentialsScreen from "./screens/ChangeCredentialsScreen";

const API_BASE = "http://192.168.4.50:4000";
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 24,
  },
  logo: {
    fontSize: 42,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#007AFF",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
});

function MainTabs({ token, onLogout, onTokenUpdate }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Files">
        {(props) => <FileScreen {...props} token={token} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {(props) => <SettingsScreen {...props} token={token} onTokenUpdate={onTokenUpdate} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App({ navigation }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(null);

  useEffect(() => {
    // navigation.navigate("LoginScreen"); // Remove this line
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const statusRes = await fetch(`${API_BASE}/auth/status`);
        const statusData = await statusRes.json();
        setIsSetup(statusData.setup);
        const savedToken = await SecureStore.getItemAsync("token");
        if (savedToken) {
          setToken(savedToken);
        }
      } catch (error) {
        console.log("bootstrap error", error.message); // Log the error message
        Alert.alert("Erreur réseau", "Impossible de joindre le serveur. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const handleLogin = async (newToken) => {
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
  };

  if (loading || isSetup === null) {
    return (
      <View style={loadingStyles.container}>
        <Text style={loadingStyles.logo}>NAS</Text>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={loadingStyles.text}>Connexion au NAS...</Text>
      </View>
    );
  }

  if (!isSetup) {
    return <SetupScreen onDone={() => setIsSetup(true)} />;
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <I18nProvider>
      <SettingsProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {(props) => (
                <MainTabs {...props} token={token} onLogout={handleLogout} onTokenUpdate={setToken} />
              )}
            </Stack.Screen>
            <Stack.Screen name="FileDetail">
              {(props) => <FileDetailScreen {...props} token={token} />}
            </Stack.Screen>
            <Stack.Screen name="ChangeCredentials">
              {(props) => (
                <ChangeCredentialsScreen
                  {...props}
                  token={token}
                  onTokenUpdate={setToken}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </I18nProvider>
  );
}