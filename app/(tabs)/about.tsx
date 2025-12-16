import { useDataActions } from "@/context/DataContext";
import { haptics } from "@/lib/haptics";
import { storage } from "@/lib/storage";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const [clearing, setClearing] = useState(false);
  const { refreshAll, refreshProgress } = useDataActions();

  const handleClearProgressData = useCallback(() => {
    Alert.alert(
      "Clear Progress Data",
      "This will delete all your workout history, streaks, and personal records. Your exercise and program library will be kept. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Progress",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            void haptics.skipAction();
            try {
              await storage.clearAllProgressData();
              refreshProgress();
              Alert.alert("Done", "All progress data has been cleared.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            } finally {
              setClearing(false);
            }
          }
        }
      ]
    );
  }, [refreshProgress]);

  const handleClearAllData = useCallback(() => {
    Alert.alert(
      "Clear All Data",
      "This will delete ALL your data including exercises, programs, workout history, and personal records. This is a full reset and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            void haptics.skipAction();
            try {
              await storage.clearAllData();
              refreshAll();
              Alert.alert("Done", "All data has been cleared.");
            } catch (error) {
              Alert.alert("Error", "Failed to clear data. Please try again.");
            } finally {
              setClearing(false);
            }
          }
        }
      ]
    );
  }, [refreshAll]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left"]}>
      <ScrollView>

      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="barbell" size={48} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>PWO</Text>
        <Text style={styles.subtitle}>Personal Workout Organizer</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons
              name="fitness-outline"
              size={20}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Track Your Progress</Text>
            <Text style={styles.infoText}>
              Monitor your workout streaks and achievements
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons
              name="time-outline"
              size={20}
              color={theme.colors.success}
            />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Guided Sessions</Text>
            <Text style={styles.infoText}>
              Follow structured challenge sessions with timers
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons
              name="trophy-outline"
              size={20}
              color={theme.colors.warning}
            />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Set Goals</Text>
            <Text style={styles.infoText}>
              Define targets and work towards them
            </Text>
          </View>
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Data Management</Text>

        <Pressable
          style={({ pressed }) => [
            styles.dangerButton,
            styles.warningButton,
            pressed && styles.dangerButtonPressed,
            clearing && styles.dangerButtonDisabled
          ]}
          onPress={handleClearProgressData}
          disabled={clearing}
        >
          <Ionicons
            name="refresh-outline"
            size={20}
            color={theme.colors.warning}
          />
          <View style={styles.dangerButtonContent}>
            <Text style={[styles.dangerButtonTitle, styles.warningText]}>
              Clear Progress Data
            </Text>
            <Text style={styles.dangerButtonDesc}>
              Reset history, streaks, and PRs
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.dangerButton,
            pressed && styles.dangerButtonPressed,
            clearing && styles.dangerButtonDisabled
          ]}
          onPress={handleClearAllData}
          disabled={clearing}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
          <View style={styles.dangerButtonContent}>
            <Text style={styles.dangerButtonTitle}>Clear All Data</Text>
            <Text style={styles.dangerButtonDesc}>
              Full reset including library
            </Text>
          </View>
        </Pressable>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xxl,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm
  },
  version: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md
  },
  infoContent: {
    flex: 1
  },
  infoTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: 2
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm
  },
  dangerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  dangerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.dangerLight,
    backgroundColor: theme.colors.dangerLight + "30",
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md
  },
  warningButton: {
    borderColor: theme.colors.warningLight,
    backgroundColor: theme.colors.warningLight + "30"
  },
  dangerButtonPressed: {
    opacity: 0.7
  },
  dangerButtonDisabled: {
    opacity: 0.5
  },
  dangerButtonContent: {
    flex: 1
  },
  dangerButtonTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.danger,
    marginBottom: 2
  },
  warningText: {
    color: theme.colors.warning
  },
  dangerButtonDesc: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
});
