import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import SetupScreen from "./screens/SetupScreen";
import FileScreen from "./screens/FileScreen";
import FileDetailScreen from "./screens/FileDetailsScreen";
import SettingsScreen from "./screens/SettingsScreen";
const API_BASE = "http://172.16.206.42:4000";
const Stack = createNativeStackNavigator();
export default function App() {
 const [token, setToken] = useState(null);
 const [loading, setLoading] = useState(true);
 const [isSetup, setIsSetup] = useState(null);
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
       console.log("bootstrap error", error);
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
<View style={{ flex: 1, justifyContent: "center" }}>
<ActivityIndicator size="large" />
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
<NavigationContainer>
<Stack.Navigator>
<Stack.Screen name="Files">
         {(props) => (
<FileScreen
             {...props}
             token={token}
             onLogout={handleLogout}
           />
         )}
</Stack.Screen>
<Stack.Screen name="FileDetail">
         {(props) => <FileDetailScreen {...props} token={token} />}
</Stack.Screen>
<Stack.Screen name="Settings">
 {(props) => (
<SettingsScreen
     {...props}
     token={token}
     onTokenUpdate={setToken}
   />
 )}
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
 );
}