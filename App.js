import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import FileScreen from "./screens/FileScreen";
import FileDetailScreen from "./screens/FileDetailsScreen";
const Stack = createNativeStackNavigator();
export default function App() {
 const [token, setToken] = useState(null);
 const [loading, setLoading] = useState(true);
 useEffect(() => {
   const loadToken = async () => {
     const savedToken = await SecureStore.getItemAsync("token");
     if (savedToken) setToken(savedToken);
     setLoading(false);
   };
   loadToken();
 }, []);
 const handleLogin = async (newToken) => {
   await SecureStore.setItemAsync("token", newToken);
   setToken(newToken);
 };
 const handleLogout = async () => {
   await SecureStore.deleteItemAsync("token");
   setToken(null);
 };
 if (loading) {
   return (
<View style={{ flex: 1, justifyContent: "center" }}>
<ActivityIndicator size="large" />
</View>
   );
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
</Stack.Navigator>
</NavigationContainer>
 );
}