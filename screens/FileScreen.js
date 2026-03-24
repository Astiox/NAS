import { useEffect, useState, useContext } from "react";
import {
 View,
 Text,
 TouchableOpacity,
 StyleSheet,
 ScrollView,
 Alert,
 Button,
 TextInput,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { SettingsContext } from "../context/SettingsContext";

const API_BASE = "http://172.16.206.42:4000";

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, ""); // Removes invalid characters
}

export default function FileScreen({ token, onLogout, navigation }) {
 const [items, setItems] = useState([]);
 const [currentPath, setCurrentPath] = useState("");
 const [loading, setLoading] = useState(false);
 const [uploading, setUploading] = useState(false);
 const [newFolderName, setNewFolderName] = useState("");
 const [creatingFolder, setCreatingFolder] = useState(false);
 const { theme, fontSize } = useContext(SettingsContext);

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
 const uploadFile = async () => {
   try {
     setUploading(true);
     const result = await DocumentPicker.getDocumentAsync({
       copyToCacheDirectory: true,
       multiple: false,
     });
     if (result.canceled) {
       return;
     }
     const file = result.assets[0];
     const formData = new FormData();
     formData.append("path", currentPath);
     formData.append("file", {
       uri: file.uri,
       name: encodeURIComponent(file.name), // Encode special characters
       type: file.mimeType || "application/octet-stream",
     });
     const res = await fetch(`${API_BASE}/files/upload`, {
       method: "POST",
       headers: {
         Authorization: `Bearer ${token}`,
       },
       body: formData,
     });
     const data = await res.json();
     if (!res.ok) {
       Alert.alert("Erreur", data.error || "Upload impossible");
       return;
     }
     Alert.alert(
       "Succès",
       `Fichier uploadé : ${data.savedAs || file.name}`
     );
     loadFiles(currentPath);
   } catch (error) {
     console.log(error);
     Alert.alert("Erreur", "Impossible d'uploader le fichier");
   } finally {
     setUploading(false);
   }
 };
 const createFolder = async () => {
   try {
     if (!newFolderName.trim()) {
       Alert.alert("Erreur", "Nom du dossier requis");
       return;
     }
     setCreatingFolder(true);
     const res = await fetch(`${API_BASE}/files/folder`, {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify({
         path: currentPath,
         name: newFolderName.trim(),
       }),
     });
     const data = await res.json();
     if (!res.ok) {
       Alert.alert("Erreur", data.error || "Impossible de créer le dossier");
       return;
     }
     Alert.alert("Succès", `Dossier créé : ${data.savedAs || newFolderName}`);
     setNewFolderName("");
     loadFiles(currentPath);
   } catch (error) {
     Alert.alert("Erreur", "Impossible de créer le dossier");
   } finally {
     setCreatingFolder(false);
   }
 };
 const openItem = (item) => {
   if (item.type === "folder") {
     loadFiles(item.path);
     return;
   }
   navigation.navigate("FileDetail", {
     item,
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
<View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
<Text style={[styles.title, { color: theme.textColor, fontSize }]}>NAS Files</Text>
<Text style={[styles.path, { color: theme.textColor }]}>Path: {currentPath || "root"}</Text>
{currentPath && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, { borderColor: "blue" }]}
            onPress={goBack}
          >
            <Text style={[styles.buttonText, { color: "blue" }]}>Remonter dans la racine</Text>
          </TouchableOpacity>
        </View>
      )}
<View style={styles.folderBox}>
  <TextInput
    style={styles.input}
    placeholder="Nom du nouveau dossier"
    value={newFolderName}
    onChangeText={setNewFolderName}
  />
  <Button
    title={creatingFolder ? "Création..." : "Créer un dossier"}
    onPress={createFolder}
    disabled={creatingFolder}
  />
</View>
<View style={styles.buttonRow}>
<TouchableOpacity
          style={[styles.button, { borderColor: "#cc3333" }]}
          onPress={onLogout}
        >
          <Text style={[styles.buttonText, { color: "#cc3333" }]}>Déconnexion</Text>
        </TouchableOpacity>
</View>
<View style={styles.buttonRow}>
<TouchableOpacity
          style={[styles.button, { borderColor: uploading ? "#ccc" : "#007AFF" }]}
          onPress={uploadFile}
          disabled={uploading}
        >
          <Text style={[styles.buttonText, { color: uploading ? "#ccc" : "#007AFF" }]}>
            {uploading ? "Upload..." : "📤 Uploader un fichier"}
          </Text>
        </TouchableOpacity>
</View>
     {loading ? (
<Text style={[styles.info, { color: theme.textColor }]}>Chargement...</Text>
     ) : (
<ScrollView style={styles.list}>
         {items.map((item) => (
<TouchableOpacity
             key={item.path}
             style={styles.item}
             onPress={() => openItem(item)}
>
<Text style={[styles.itemText, { color: theme.textColor }]}>
               {item.type === "folder" ? "📁" : "📄"} {item.name}
</Text>
</TouchableOpacity>
         ))}
         {!items.length && <Text style={[styles.info, { color: theme.textColor }]}>Aucun fichier</Text>}
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
   marginBottom: 10, // Correctly closed this object
 },
 button: {
   borderWidth: 2,
   borderRadius: 8,
   paddingVertical: 10,
   paddingHorizontal: 15,
   marginBottom: 10,
   alignItems: "center",
 },
 buttonText: {
   fontSize: 16,
   fontWeight: "bold",
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
 folderBox: {
   marginBottom: 16,
 },
 input: {
   borderWidth: 1,
   borderColor: "#ccc",
   borderRadius: 8,
   padding: 10,
   marginBottom: 10,
   backgroundColor: "#fff",
 },
 itemMeta: {
   fontSize: 13,
   color: "#666",
   marginTop: 4,
 },
});