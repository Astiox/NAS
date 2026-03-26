import * as DocumentPicker from "expo-document-picker";
import { useContext, useEffect, useState } from "react";
import {
    Alert,
    Button,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { NAS_API_BASE } from "../config";
import { SettingsContext } from "../context/SettingsContext";

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

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

export default function FileScreen({ laravelToken, onLogout, navigation }) {
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
       ? `${NAS_API_BASE}/files?path=${encodeURIComponent(path)}`
       : `${NAS_API_BASE}/files`;
     const authHeader = `Bearer ${laravelToken}`;
     
     console.log("[FileScreen] NAS request URL:", url);
     console.log("[FileScreen] laravelToken exists:", !!laravelToken);
     console.log("[FileScreen] Authorization header:", authHeader);
     
     const res = await fetch(url, {
       headers: {
         Authorization: authHeader,
         Accept: "application/json",
       },
     });
     
     console.log("[FileScreen] NAS response status:", res.status);
     const text = await res.text();
     console.log("[FileScreen] NAS response body:", text);
     const data = safeParseJson(text);
     
     if (!res.ok) {
       Alert.alert("Erreur", data?.error || "Impossible de charger les fichiers");
       return;
     }
     const nextItems = Array.isArray(data?.items) ? data.items : [];
     console.log("[FileScreen] Setting items count:", nextItems.length);
     setItems(nextItems);
     setCurrentPath(data?.currentPath || "");
   } catch (error) {
     console.log("[FileScreen] Error:", error.message);
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
     const sanitizedFileName = sanitizeName(file.name) || "upload";
     const formData = new FormData();
     formData.append("path", currentPath);
     formData.append("file", {
       uri: file.uri,
       name: sanitizedFileName,
       type: file.mimeType || "application/octet-stream",
     });
     const authHeader = `Bearer ${laravelToken}`;
     const url = `${NAS_API_BASE}/files`;

     console.log("[FileScreen] Upload URL:", url);
     console.log("[FileScreen] laravelToken exists:", !!laravelToken);
     console.log("[FileScreen] Authorization header:", authHeader);

     const res = await fetch(url, {
       method: "POST",
       headers: {
         Authorization: authHeader,
         Accept: "application/json",
       },
       body: formData,
     });

     console.log("[FileScreen] Upload response status:", res.status);
     const text = await res.text();
     console.log("[FileScreen] Upload response body:", text);
     const data = safeParseJson(text);

     if (!res.ok) {
       Alert.alert("Erreur", data?.error || data?.message || text || "Upload impossible");
       return;
     }

     Alert.alert(
       "Succès",
       `Fichier uploadé : ${data?.savedAs || file.name}`
     );
     loadFiles(currentPath);
   } catch (error) {
     console.log("[FileScreen] Upload error:", error);
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
     const authHeader = `Bearer ${laravelToken}`;
     
     console.log("[FileScreen] Create folder URL:", `${NAS_API_BASE}/files/folder`);
     console.log("[FileScreen] laravelToken exists:", !!laravelToken);
     console.log("[FileScreen] Authorization header:", authHeader);
     
     const res = await fetch(`${NAS_API_BASE}/files/folder`, {
       method: "POST",
        headers: {
         "Content-Type": "application/json",
         Authorization: authHeader,
         Accept: "application/json",
       },
       body: JSON.stringify({
         path: currentPath,
         name: newFolderName.trim(),
       }),
     });
     
     console.log("[FileScreen] Create folder response status:", res.status);
     const text = await res.text();
     console.log("[FileScreen] Create folder response body:", text);
     const data = safeParseJson(text);
     
     if (!res.ok) {
       Alert.alert("Erreur", data?.error || "Impossible de créer le dossier");
       return;
     }
     Alert.alert("Succès", `Dossier créé : ${data?.savedAs || newFolderName}`);
     setNewFolderName("");
     loadFiles(currentPath);
   } catch (error) {
     console.log("[FileScreen] Create folder error:", error);
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

 const handleFolderLongPress = (item) => {
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
             onLongPress={() => item.type === "folder" && handleFolderLongPress(item)}
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
