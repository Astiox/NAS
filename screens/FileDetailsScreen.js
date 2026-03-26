import * as FileSystem from "expo-file-system/legacy";
import { StorageAccessFramework } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useContext, useState } from "react";
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NAS_API_BASE } from "../config";
import { SettingsContext } from "../context/SettingsContext";

function getMimeType(fileName) {
 const lower = fileName.toLowerCase();
 if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
 if (lower.endsWith(".png")) return "image/png";
 if (lower.endsWith(".gif")) return "image/gif";
 if (lower.endsWith(".webp")) return "image/webp";
 if (lower.endsWith(".pdf")) return "application/pdf";
 if (lower.endsWith(".txt")) return "text/plain";
 if (lower.endsWith(".mp4")) return "video/mp4";
 if (lower.endsWith(".mp3")) return "audio/mpeg";
 if (lower.endsWith(".json")) return "application/json";
 return "application/octet-stream";
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

function sanitizePathSegment(value) {
 return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");
}

export default function FileDetailScreen({ route, navigation, laravelToken }) {
 const { item, refreshParent } = route.params;
 const [busy, setBusy] = useState(false);
 const [renameValue, setRenameValue] = useState(item.name);
 const [renaming, setRenaming] = useState(false);
 const { theme, fontSize } = useContext(SettingsContext);
 const isFolder = item.type === "folder";

 const parseErrorMessage = (data, fallback) =>
  data?.error || data?.message || fallback;

 const fetchFolderItems = async (folderPath) => {
   const authHeader = `Bearer ${laravelToken}`;
   const url = `${NAS_API_BASE}/files?path=${encodeURIComponent(folderPath)}`;

   console.log("[FileDetailsScreen] Folder listing URL:", url);
   console.log("[FileDetailsScreen] laravelToken exists:", !!laravelToken);
   console.log("[FileDetailsScreen] Authorization header:", authHeader);

   const res = await fetch(url, {
     headers: {
       Authorization: authHeader,
       Accept: "application/json",
     },
   });

   console.log("[FileDetailsScreen] Folder listing status:", res.status);
   const text = await res.text();
   console.log("[FileDetailsScreen] Folder listing body:", text);
   const data = safeParseJson(text);

   if (!res.ok) {
     throw new Error(parseErrorMessage(data, text || "Impossible de lire le dossier"));
   }

   return Array.isArray(data?.items) ? data.items : [];
 };

 const ensureDirectory = async (directoryUri) => {
   const info = await FileSystem.getInfoAsync(directoryUri);
   if (!info.exists) {
     await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
   }
 };

 const downloadFileToPath = async (remotePath, targetUri) => {
   const authHeader = `Bearer ${laravelToken}`;
   const remoteUrl = `${NAS_API_BASE}/files?path=${encodeURIComponent(remotePath)}&download=1`;

   console.log("[FileDetailsScreen] Download URL:", remoteUrl);
   console.log("[FileDetailsScreen] laravelToken exists:", !!laravelToken);
   console.log("[FileDetailsScreen] Authorization header:", authHeader);

   const result = await FileSystem.downloadAsync(remoteUrl, targetUri, {
    headers: {
     Authorization: authHeader,
     Accept: "application/json",
    },
   });

   console.log("[FileDetailsScreen] Download status:", result.status);

   if (result.status !== 200) {
    throw new Error(`Téléchargement impossible (${result.status})`);
   }

   return result.uri;
 };

 const downloadFolderRecursively = async (folderItem, baseDirectory) => {
   const rootDirectory = `${baseDirectory}${sanitizePathSegment(folderItem.name)}`;
   await ensureDirectory(rootDirectory);

   const walk = async (remoteFolderPath, localDirectory) => {
     const children = await fetchFolderItems(remoteFolderPath);

     for (const child of children) {
       if (child.type === "folder") {
         const nextDirectory = `${localDirectory}/${sanitizePathSegment(child.name)}`;
         await ensureDirectory(nextDirectory);
         await walk(child.path, nextDirectory);
         continue;
       }

       const targetUri = `${localDirectory}/${sanitizePathSegment(child.name)}`;
       await downloadFileToPath(child.path, targetUri);
     }
   };

   await walk(folderItem.path, rootDirectory);
   return rootDirectory;
 };

 const downloadToAppStorage = async () => {
   if (isFolder) {
     return downloadFolderRecursively(item, FileSystem.cacheDirectory);
   }

   const targetUri = `${FileSystem.cacheDirectory}${sanitizePathSegment(item.name)}`;
   return downloadFileToPath(item.path, targetUri);
 };

 const handleDownload = async () => {
   try {
     setBusy(true);
     const localUri = await downloadToAppStorage();
     if (Platform.OS === "ios") {
       const canShare = await Sharing.isAvailableAsync();
       if (!canShare) {
         Alert.alert("Erreur", "Le partage n'est pas disponible sur cet appareil");
         return;
       }
       await Sharing.shareAsync(localUri, {
         mimeType: isFolder ? undefined : getMimeType(item.name),
         dialogTitle: isFolder ? "Exporter le dossier" : "Enregistrer dans Fichiers",
       });
       return;
     }
     if (Platform.OS === "android") {
       if (isFolder) {
         const canShare = await Sharing.isAvailableAsync();
         if (canShare) {
           await Sharing.shareAsync(localUri, {
             dialogTitle: "Partager le dossier",
           });
           return;
         }

         Alert.alert("OK", `Dossier téléchargé dans le cache : ${item.name}`);
         return;
       }

       const permissions =
         await StorageAccessFramework.requestDirectoryPermissionsAsync();
       if (!permissions.granted) {
         Alert.alert("Annulé", "Aucun dossier sélectionné");
         return;
       }
       const base64Content = await FileSystem.readAsStringAsync(localUri, {
         encoding: FileSystem.EncodingType.Base64,
       });
       const mimeType = getMimeType(item.name);
       const dotIndex = item.name.lastIndexOf(".");
       const hasExt = dotIndex > 0;
       const fileBaseName = hasExt ? item.name.slice(0, dotIndex) : item.name;
       const safFileUri = await StorageAccessFramework.createFileAsync(
         permissions.directoryUri,
         fileBaseName,
         mimeType
       );
       await FileSystem.writeAsStringAsync(safFileUri, base64Content, {
         encoding: FileSystem.EncodingType.Base64,
       });
       Alert.alert("OK", `Fichier enregistré : ${item.name}`);
     }
   } catch (error) {
     Alert.alert("Erreur", "Impossible de télécharger le fichier");
   } finally {
     setBusy(false);
   }
 };

 const handleShareAndroid = async () => {
   try {
     if (Platform.OS !== "android") return;
     setBusy(true);
     const localUri = await downloadToAppStorage();
     const canShare = await Sharing.isAvailableAsync();
     if (!canShare) {
       Alert.alert("Erreur", "Le partage n'est pas disponible sur cet appareil");
       return;
     }
     await Sharing.shareAsync(localUri, {
       mimeType: isFolder ? undefined : getMimeType(item.name),
       dialogTitle: isFolder ? "Partager le dossier" : "Partager le fichier",
     });
   } catch (error) {
     Alert.alert("Erreur", isFolder ? "Impossible de partager le dossier" : "Impossible de partager le fichier");
   } finally {
     setBusy(false);
   }
 };

 const deleteFile = async () => {
   Alert.alert(
     "Confirmation",
     `Supprimer "${item.name}" ?`,
     [
       {
         text: "Annuler",
         style: "cancel",
       },
       {
         text: "Supprimer",
         style: "destructive",
         onPress: async () => {
           try {
             const authHeader = `Bearer ${laravelToken}`;
             const url = `${NAS_API_BASE}/files?path=${encodeURIComponent(item.path)}`;

             console.log("[FileDetailsScreen] Delete URL:", url);
             console.log("[FileDetailsScreen] Delete method:", "DELETE");
             console.log("[FileDetailsScreen] laravelToken exists:", !!laravelToken);
             console.log("[FileDetailsScreen] Authorization header:", authHeader);

             const res = await fetch(url, {
              method: "DELETE",
              headers: {
               Authorization: authHeader,
               Accept: "application/json",
              },
             });

             console.log("[FileDetailsScreen] Delete response status:", res.status);
             const text = await res.text();
             console.log("[FileDetailsScreen] Delete response body:", text);
             const data = safeParseJson(text);

             if (!res.ok) {
               Alert.alert("Erreur", parseErrorMessage(data, text || "Suppression impossible"));
               return;
             }

             Alert.alert("OK", isFolder ? "Dossier supprimé" : "Fichier supprimé");
             if (refreshParent) {
               refreshParent();
             }
             navigation.goBack();
           } catch (error) {
             console.log("[FileDetailsScreen] Delete error:", error);
             Alert.alert("Erreur", "Impossible de supprimer le fichier");
           }
         },
       },
     ]
   );
 };

 const renameItem = async () => {
   try {
     if (!renameValue.trim()) {
       Alert.alert("Erreur", "Nom requis");
       return;
     }
     setRenaming(true);
     
     const url = `${NAS_API_BASE}/files/rename`;
     const authHeader = `Bearer ${laravelToken}`;
     console.log("[FileDetailsScreen] Rename URL:", url);
     console.log("[FileDetailsScreen] laravelToken exists:", !!laravelToken);
     console.log("[FileDetailsScreen] Authorization header:", authHeader);
     
     const res = await fetch(url, {
       method: "PATCH",
       headers: {
         "Content-Type": "application/json",
         Authorization: authHeader,
         Accept: "application/json",
       },
       body: JSON.stringify({
         oldPath: item.path,
         newName: renameValue.trim(),
       }),
     });
     
     console.log("[FileDetailsScreen] Rename response status:", res.status);
     const text = await res.text();
     console.log("[FileDetailsScreen] Rename response body:", text);
     const data = safeParseJson(text);
     
     if (!res.ok) {
       Alert.alert("Erreur", data?.error || "Impossible de renommer");
       return;
     }
     Alert.alert("Succès", `Renommé en : ${data?.savedAs || renameValue}`);
     if (refreshParent) {
       refreshParent();
     }
     navigation.goBack();
   } catch (error) {
     console.log("[FileDetailsScreen] Rename error:", error);
     Alert.alert("Erreur", "Impossible de renommer");
   } finally {
     setRenaming(false);
   }
 };

 return (
  <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.textColor, fontSize }]}>{item.name}</Text>
    </View>
    <View style={styles.details}>
      <Text style={[styles.meta, { color: theme.textColor }]}>Type : {item.type}</Text>
      <Text style={[styles.meta, { color: theme.textColor }]}>Chemin : {item.path}</Text>
      <Text style={[styles.meta, { color: theme.textColor }]}>Taille : {item.size} octets</Text>
    </View>
    <TextInput
      style={styles.renameInput}
      value={renameValue}
      onChangeText={setRenameValue}
      placeholder="Nouveau nom"
    />
    <TouchableOpacity
      style={[styles.button, renaming && styles.buttonDisabled]}
      onPress={renameItem}
      disabled={renaming}
    >
      <Text style={styles.buttonText}>
        {renaming ? "Renommage..." : "Renommer"}
      </Text>
    </TouchableOpacity>
    <View style={styles.actions}>
      <TouchableOpacity
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={handleDownload}
        disabled={busy}
      >
        <Text style={styles.buttonText}>
          {busy ? "Traitement..." : isFolder ? "Télécharger le dossier" : "Télécharger"}
        </Text>
      </TouchableOpacity>
      {Platform.OS === "android" && (
        <TouchableOpacity
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={handleShareAndroid}
          disabled={busy}
        >
          <Text style={styles.buttonText}>{isFolder ? "Partager le dossier" : "Partager"}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.button, styles.deleteButton]}
        onPress={deleteFile}
      >
        <Text style={styles.buttonText}>Supprimer</Text>
      </TouchableOpacity>
    </View>
  </View>
 );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  header: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  details: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  meta: {
    fontSize: 16,
    marginBottom: 8,
    color: "#444",
  },
  actions: {
    marginTop: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  deleteButton: {
    backgroundColor: "#cc3333",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  renameInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
});
