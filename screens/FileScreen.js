import { useEffect, useState } from "react";
import {
 View,
 Text,
 TouchableOpacity,
 StyleSheet,
 ScrollView,
 Alert,
 Button,
} from "react-native";
const API_BASE = "http://172.16.206.42:4000";
export default function FileScreen({ token, onLogout, navigation }) {
 const [items, setItems] = useState([]);
 const [currentPath, setCurrentPath] = useState("");
 const [loading, setLoading] = useState(false);
 const loadFiles = async (path = "") => {
   try {
     setLoading(true);
     const url = path
       ? `${API_BASE}/files?path=${encodeURIComponent(path)}`
       : `${API_BASE}/files`;
     const res = await fetch(url, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });
     const data = await res.json();
     if (!res.ok) {
       Alert.alert("Erreur", data.error || "Impossible de charger les fichiers");
       return;
     }
     setItems(data.items || []);
     setCurrentPath(data.currentPath || "");
   } catch (error) {
     Alert.alert("Erreur réseau", "Impossible de joindre l'API");
   } finally {
     setLoading(false);
   }
 };
 useEffect(() => {
   loadFiles();
 }, []);
 const openItem = (item) => {
   if (item.type === "folder") {
     loadFiles(item.path);
     return;
   }
   navigation.navigate("FileDetail", {
     item,
     currentPath,
     refreshParent: () => loadFiles(currentPath),
   });
 };
 const goBack = () => {
   if (!currentPath) return;
   const parts = currentPath.split("/").filter(Boolean);
   parts.pop();
   loadFiles(parts.join("/"));
 };
 return (
<View style={styles.container}>
<Text style={styles.title}>NAS Files</Text>
<Text style={styles.path}>Path: {currentPath || "root"}</Text>
<View style={styles.buttonRow}>
<View style={styles.button}>
<Button title="Déconnexion" onPress={onLogout} color="#cc3333" />
</View>
</View>
<View style={styles.buttonRow}>
<View style={styles.button}>
<Button
           title="⬅ Retour"
           onPress={goBack}
           disabled={!currentPath}
           color={currentPath ? "blue" : "gray"}
         />
</View>
</View>
     {loading ? (
<Text style={styles.info}>Chargement...</Text>
     ) : (
<ScrollView style={styles.list}>
         {items.map((item) => (
<TouchableOpacity
             key={item.path}
             style={styles.item}
             onPress={() => openItem(item)}
>
<Text style={styles.itemText}>
               {item.type === "folder" ? "📁" : "📄"} {item.name}
</Text>
</TouchableOpacity>
         ))}
         {!items.length && <Text style={styles.info}>Aucun fichier</Text>}
</ScrollView>
     )}
</View>
 );
}
const styles = StyleSheet.create({
 container: {
   flex: 1,
   paddingTop: 60,
   paddingHorizontal: 20,
   backgroundColor: "#fff",
 },
 title: {
   fontSize: 28,
   fontWeight: "bold",
   marginBottom: 8,
 },
 path: {
   marginBottom: 16,
   color: "#555",
 },
 buttonRow: {
   marginBottom: 10,
 },
 button: {
   borderRadius: 8,
   overflow: "hidden",
 },
 list: {
   marginTop: 16,
 },
 item: {
   paddingVertical: 14,
   borderBottomWidth: 1,
   borderBottomColor: "#eee",
 },
 itemText: {
   fontSize: 18,
 },
 info: {
   marginTop: 20,
   textAlign: "center",
   color: "#666",
 },
});