import { UnifiedDataManager } from "@/components/data";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChallengesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.refresh();
    setRefreshKey((prev) => prev + 1);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const handleCreateChallenge = () => {
    haptics.buttonTap();
    router.navigate("/library/challenges/new");
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Challenges</Text>
              <Text style={styles.subtitle}>
                Progressive fitness challenges to push your limits
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed
              ]}
              onPress={handleCreateChallenge}
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

        {/* Unified Data Manager - Challenges Tab */}
        <UnifiedDataManager 
          initialTab="challenges" 
          style={styles.dataManager}
          key={refreshKey}
        />
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
  }
});
