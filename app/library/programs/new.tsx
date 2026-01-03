import { useDataActions } from "@/context/DataContext";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewProgramScreen() {
  const actions = useDataActions();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a program name");
      return;
    }

    setSaving(true);
    try {
      await actions.upsertProgram({
        id: "",
        name: name.trim(),
        description: "",
        sessions: [
          {
            index: 1,
            name: "Session 1",
            blocks: [{ type: "warmup", seconds: 180 }]
          }
        ]
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Program</Text>
        
        <Text style={styles.label}>Program Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter program name"
          style={styles.input}
        />
        
        <View style={styles.buttons}>
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          
          <Pressable 
            onPress={handleSave} 
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  content: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    marginBottom: 16
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center"
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#333"
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center"
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    fontSize: 16,
    color: "white",
    fontWeight: "500"
  }
});