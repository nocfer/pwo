import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

export default function AboutScreen() {
  return (
    <View style={styles.container}>
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
            <Ionicons name="fitness-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Track Your Progress</Text>
            <Text style={styles.infoText}>Monitor your workout streaks and achievements</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="time-outline" size={20} color={theme.colors.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Guided Sessions</Text>
            <Text style={styles.infoText}>Follow structured workout routines with timers</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="trophy-outline" size={20} color={theme.colors.warning} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Set Goals</Text>
            <Text style={styles.infoText}>Define targets and work towards them</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xxl,
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    marginBottom: theme.spacing.sm,
  },
  version: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
});
