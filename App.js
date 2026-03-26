import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { I18nProvider } from "./context/I18nContext";
import { SettingsProvider } from "./context/SettingsContext";
import ChangeCredentialsScreen from "./screens/ChangeCredentialsScreen";
import FileDetailScreen from "./screens/FileDetailsScreen";
import FileScreen from "./screens/FileScreen";
import LoginScreen from "./screens/LoginScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SetupScreen from "./screens/SetupScreen";

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

function MainTabs({ laravelToken, onLogout, onTokenUpdate }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = "ellipse";

          if (route.name === "Files") {
            iconName = focused ? "folder" : "folder-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Files">
        {(props) => <FileScreen {...props} laravelToken={laravelToken} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {(props) => <SettingsScreen {...props} laravelToken={laravelToken} onTokenUpdate={onTokenUpdate} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App({ navigation }) {
  const [laravelToken, setLaravelToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSetup, setIsSetup] = useState(true);

  useEffect(() => {
    // navigation.navigate("LoginScreen"); // Remove this line
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedLaravelToken = await SecureStore.getItemAsync("laravelToken");
        const savedUser = await SecureStore.getItemAsync("user");

        console.log("[Bootstrap] laravelToken exists:", !!savedLaravelToken);

        if (savedLaravelToken) {
          setLaravelToken(savedLaravelToken);
        }
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.log("bootstrap error", error.message);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const handleLogin = async (newLaravelToken, newUser, newSettings) => {
    console.log("[handleLogin] storing laravelToken:", !!newLaravelToken);
    
    if (newLaravelToken) {
      await SecureStore.setItemAsync("laravelToken", newLaravelToken);
      setLaravelToken(newLaravelToken);
    }
    if (newUser) {
      await SecureStore.setItemAsync("user", JSON.stringify(newUser));
      setUser(newUser);
    }
    if (newSettings) {
      await SecureStore.setItemAsync("settings", JSON.stringify(newSettings));
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("laravelToken");
    await SecureStore.deleteItemAsync("user");
    await SecureStore.deleteItemAsync("settings");
    await SecureStore.deleteItemAsync("localTheme");
    await SecureStore.deleteItemAsync("localFontSize");
    setLaravelToken(null);
    setUser(null);
  };

  if (loading || isSetup === null) {
    return (
      <View style={loadingStyles.container}>
        <Text style={loadingStyles.logo}>NAS</Text>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={loadingStyles.text}>Initialisation...</Text>
      </View>
    );
  }

  if (!isSetup) {
    return <SetupScreen onDone={() => setIsSetup(true)} />;
  }

  if (!laravelToken) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <I18nProvider>
      <SettingsProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {(props) => (
                <MainTabs {...props} laravelToken={laravelToken} onLogout={handleLogout} onTokenUpdate={setLaravelToken} />
              )}
            </Stack.Screen>
            <Stack.Screen name="FileDetail">
              {(props) => <FileDetailScreen {...props} laravelToken={laravelToken} />}
            </Stack.Screen>
            <Stack.Screen name="ChangeCredentials">
              {(props) => (
                <ChangeCredentialsScreen
                  {...props}
                  laravelToken={laravelToken}
                  onTokenUpdate={setLaravelToken}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        </NavigationContainer>
      </SettingsProvider>
    </I18nProvider>
  );
}
