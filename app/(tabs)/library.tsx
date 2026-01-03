import { UnifiedDataManager } from "@/components/data";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LibraryScreen() {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const handleCreateNew = (type: "exercise" | "program" | "challenge") => {
    haptics.buttonTap();
    setShowCreateMenu(false);
    switch (type) {
      case "exercise":
        router.navigate("/library/exercises/new");
        break;
      case "program":
        router.navigate("/library/programs/new");
        break;
      case "challenge":
        router.navigate("/library/challenges/new");
        break;
    }
  };

  const handleScanQR = () => {
    haptics.buttonTap();
    router.navigate("/library/scan");
  };

  const handleShowCreateMenu = () => {
    haptics.buttonTap();
    setShowCreateMenu(true);
  };

  const handleCloseCreateMenu = () => {
    setShowCreateMenu(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Data Management</Text>
              <Text style={styles.subtitle}>
                Manage exercises, programs, and challenges
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.scanButton,
                  pressed && styles.scanButtonPressed
                ]}
                onPress={handleScanQR}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={22}
                  color={theme.colors.primary}
                />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.addButtonPressed
                ]}
                onPress={handleShowCreateMenu}
              >
                <Ionicons
                  name="add"
                  size={22}
                  color={theme.colors.primaryTextOn}
                />
                <Text style={styles.addButtonText}>New</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Unified Data Manager */}
        <UnifiedDataManager style={styles.dataManager} />

        {/* Create Menu Modal */}
        <Modal
          visible={showCreateMenu}
          transparent
          animationType="fade"
          onRequestClose={handleCloseCreateMenu}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={handleCloseCreateMenu}
          >
            <View style={styles.createMenu}>
              <Text style={styles.createMenuTitle}>Create New</Text>

              <Pressable
                style={({ pressed }) => [
                  styles.createMenuItem,
                  pressed && styles.createMenuItemPressed
                ]}
                onPress={() => handleCreateNew("exercise")}
              >
                <Ionicons
                  name="fitness-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.createMenuItemText}>
                  <Text style={styles.createMenuItemTitle}>Exercise</Text>
                  <Text style={styles.createMenuItemSubtitle}>
                    Add a new exercise to your library
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.createMenuItem,
                  pressed && styles.createMenuItemPressed
                ]}
                onPress={() => handleCreateNew("program")}
              >
                <Ionicons
                  name="list-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.createMenuItemText}>
                  <Text style={styles.createMenuItemTitle}>Program</Text>
                  <Text style={styles.createMenuItemSubtitle}>
                    Create a structured workout program
                  </Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.createMenuItem,
                  pressed && styles.createMenuItemPressed
                ]}
                onPress={() => handleCreateNew("challenge")}
              >
                <Ionicons
                  name="trophy-outline"
                  size={24}
                  color={theme.colors.primary}
                />
                <View style={styles.createMenuItemText}>
                  <Text style={styles.createMenuItemTitle}>Challenge</Text>
                  <Text style={styles.createMenuItemSubtitle}>
                    Set up a progressive fitness challenge
                  </Text>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    padding: theme.spacing.lg
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  },
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    alignItems: "center"
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm
  },
  scanButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }]
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadows.sm
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  addButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  dataManager: {
    flex: 1
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg
  },
  createMenu: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    width: "100%",
    maxWidth: 320,
    ...theme.shadows.lg
  },
  createMenuTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: "center"
  },
  createMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.sm
  },
  createMenuItemPressed: {
    backgroundColor: theme.colors.card
  },
  createMenuItemText: {
    marginLeft: theme.spacing.md,
    flex: 1
  },
  createMenuItemTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  createMenuItemSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs
  }
});
