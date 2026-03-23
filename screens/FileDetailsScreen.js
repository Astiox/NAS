import { useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
const API_BASE = "http://172.16.206.42:4000";
export default function FileDetailScreen({ route, navigation, token }) {
 const { item, refreshParent } = route.params;
 const [localUri, setLocalUri] = useState(null);
 const [downloading, setDownloading] = useState(false);
 const downloadFile = async () => {
   try {
     setDownloading(true);
     const remoteUrl = `${API_BASE}/files/download?path=${encodeURIComponent(item.path)}`;
     const targetUri = `${FileSystem.documentDirectory}${item.name}`;
     const result = await FileSystem.downloadAsync(remoteUrl, targetUri, {
       headers: {
         Authorization: `Bearer ${token}`,
       },
     });
     if (result.status !== 200) {
       Alert.alert("Erreur", `Téléchargement impossible (${result.status})`);
       return;
     }
     setLocalUri(result.uri);
     const info = await FileSystem.getInfoAsync(result.uri);
     Alert.alert(
       "Téléchargement terminé",
       `Fichier : ${item.name}\nPrésent localement : ${info.exists ? "oui" : "non"}\nTaille : ${info.size ?? 0} octets`
     );
   } catch (error) {
     Alert.alert("Erreur", "Impossible de télécharger le fichier");
   } finally {
     setDownloading(false);
   }
 };
 const shareFile = async () => {
   try {
     if (!localUri) {
       Alert.alert("Info", "Télécharge d'abord le fichier");
       return;
     }
     const canShare = await Sharing.isAvailableAsync();
     if (!canShare) {
       Alert.alert("Erreur", "Le partage n'est pas disponible sur cet appareil");
       return;
     }
     await Sharing.shareAsync(localUri);
   } catch (error) {
     Alert.alert("Erreur", "Impossible de partager le fichier");
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
             const res = await fetch(
               `${API_BASE}/files?path=${encodeURIComponent(item.path)}`,
               {
                 method: "DELETE",
                 headers: {
                   Authorization: `Bearer ${token}`,
                 },
               }
             );
             const data = await res.json();
             if (!res.ok) {
               Alert.alert("Erreur", data.error || "Suppression impossible");
               return;
             }
             Alert.alert("OK", "Fichier supprimé");
             if (refreshParent) {
               refreshParent();
             }
             navigation.goBack();
           } catch (error) {
             Alert.alert("Erreur", "Impossible de supprimer le fichier");
           }
         },
       },
     ]
   );
 };
 return (
<View style={styles.container}>
<Text style={styles.title}>{item.name}</Text>
<Text style={styles.meta}>Type : {item.type}</Text>
<Text style={styles.meta}>Chemin : {item.path}</Text>
<Text style={styles.meta}>Taille : {item.size} octets</Text>
<View style={styles.spacer} />
<Button
       title={downloading ? "Téléchargement..." : "Télécharger"}
       onPress={downloadFile}
       disabled={downloading}
     />
<View style={styles.spacer} />
<Button title="Partager" onPress={shareFile} />
<View style={styles.spacer} />
<Button title="Supprimer" onPress={deleteFile} color="#cc3333" />
</View>
 );
}
const styles = StyleSheet.create({
 container: {
   flex: 1,
   padding: 20,
   backgroundColor: "#fff",
   justifyContent: "center",
 },
 title: {
   fontSize: 26,
   fontWeight: "bold",
   marginBottom: 20,
 },
 meta: {
   fontSize: 16,
   marginBottom: 8,
   color: "#444",
 },
 spacer: {
   height: 16,
 },
});