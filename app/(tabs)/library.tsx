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

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Library</Text>
              <Text style={styles.subtitle}>
                Exercises, programs & challenges
              </Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.iconButtonPressed
                ]}
                onPress={handleScanQR}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={20}
                  color={theme.colors.text}
                />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.addButtonPressed
                ]}
                onPress={() => {
                  haptics.buttonTap();
                  setShowCreateMenu(true);
                }}
              >
                <Ionicons
                  name="add"
                  size={20}
                  color={theme.colors.primaryTextOn}
                />
                <Text style={styles.addButtonText}>New</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Data Manager */}
        <UnifiedDataManager style={styles.dataManager} />

        {/* Create Menu Modal */}
        <Modal
          visible={showCreateMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateMenu(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowCreateMenu(false)}
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
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: theme.colors.primaryLight }
                  ]}
                >
                  <Ionicons
                    name="fitness-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.createMenuItemText}>
                  <Text style={styles.createMenuItemTitle}>Exercise</Text>
                  <Text style={styles.createMenuItemSubtitle}>
                    Add a new exercise
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.muted}
                />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.createMenuItem,
                  pressed && styles.createMenuItemPressed
                ]}
                onPress={() => handleCreateNew("program")}
              >
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: theme.colors.successLight }
                  ]}
                >
                  <Ionicons
                    name="list-outline"
                    size={20}
                    color={theme.colors.success}
                  />
                </View>
                <View style={styles.createMenuItemText}>
                  <Text style={styles.createMenuItemTitle}>Program</Text>
                  <Text style={styles.createMenuItemSubtitle}>
                    Create a workout program
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.muted}
                />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.createMenuItem,
                  pressed && styles.createMenuItemPressed
                ]}
                onPress={() => handleCreateNew("challenge")}
              >
                <View
                  style={[
                    styles.menuItemIcon,
                    { backgroundColor: theme.colors.accentLight }
                  ]}
                >
                  <Ionicons
                    name="trophy-outline"
                    size={20}
                    color={theme.colors.accent}
                  />
                </View>
                <View style={styles.createMenuItemText}>
                  <Text style={styles.createMenuItemTitle}>Challenge</Text>
                  <Text style={styles.createMenuItemSubtitle}>
                    Set up a fitness challenge
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.muted}
                />
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
    borderBottomColor: theme.colors.borderLight
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg
  },
  headerText: {
    flex: 1
  },
  title: {
    ...theme.typography.h1,
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center"
  },
  iconButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }]
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md
  },
  addButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  addButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
    fontSize: 14
  },
  dataManager: {
    flex: 1
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg
  },
  createMenu: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: "100%",
    maxWidth: 340
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
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm
  },
  createMenuItemPressed: {
    backgroundColor: theme.colors.background
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  createMenuItemText: {
    flex: 1
  },
  createMenuItemTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  createMenuItemSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginTop: 2
  }
});
