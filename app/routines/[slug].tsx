import { ProgressView, SessionsView } from "@/components";
import { useLiveHistory } from "@/hooks/data";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function RoutinePage() {
  const params = useLocalSearchParams();
  const slug = params.slug as string;

  const [targets, setTargets] = useState<
    { label: string; value: number; unit?: string }[]
  >([]);
  const { data: liveRecent } = useLiveHistory(slug);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tmod = await import("@/assets/data/targets.json");
        if (!mounted) return;
        const tentry = (tmod as any).default.find((e: any) => e.slug === slug);
        setTargets(tentry?.targets ?? []);
      } catch {
        // swallow for mock data
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Routine</Text>
        <Text style={styles.subtitle}>{slug.replace(/-/g, " ")}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="flame-outline" size={18} color={theme.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Progress</Text>
        </View>
        <ProgressView slug={slug} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: theme.colors.warningLight }]}>
            <Ionicons name="trophy-outline" size={18} color={theme.colors.warning} />
          </View>
          <Text style={styles.cardTitle}>Targets</Text>
        </View>
        {targets.length === 0 ? (
          <Text style={styles.muted}>No targets set.</Text>
        ) : (
          <View style={styles.listGap}>
            {targets.map((t, i) => (
              <View key={i} style={styles.targetRow}>
                <Text style={styles.targetLabel}>{t.label}</Text>
                <View style={styles.targetValueContainer}>
                  <Text style={styles.targetValue}>
                    {t.value}
                    {t.unit ? ` ${t.unit}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: theme.colors.successLight }]}>
            <Ionicons name="time-outline" size={18} color={theme.colors.success} />
          </View>
          <Text style={styles.cardTitle}>Recent History</Text>
        </View>
        {!liveRecent || liveRecent.length === 0 ? (
          <Text style={styles.muted}>No sessions yet.</Text>
        ) : (
          <View style={styles.listGap}>
            {liveRecent.slice(0, 5).map((r, i) => (
              <View key={i} style={styles.historyItem}>
                <Text style={styles.historyDate}>{r.date}</Text>
                <Text style={styles.historySummary}>{r.summary}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconContainer, { backgroundColor: theme.colors.phases.workingBg }]}>
            <Ionicons name="barbell-outline" size={18} color={theme.colors.phases.working} />
          </View>
          <Text style={styles.cardTitle}>Sessions</Text>
        </View>
        <SessionsView slug={slug} />
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => {
          console.log("Start session for", slug);
        }}
      >
        <Ionicons name="play" size={20} color={theme.colors.primaryTextOn} style={styles.ctaIcon} />
        <Text style={styles.ctaText}>Start Session</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textTransform: "capitalize",
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  listGap: {
    gap: theme.spacing.sm,
  },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  targetLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  targetValueContainer: {
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  targetValue: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
  historyItem: {
    paddingVertical: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyDate: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    marginBottom: 2,
  },
  historySummary: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.md,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaIcon: {
    marginRight: theme.spacing.sm,
  },
  ctaText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },
});
