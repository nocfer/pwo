import ProgressView from "@/components/ProgressView";
import { theme } from "@/theme/theme";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function RoutinePage() {
  const params = useLocalSearchParams();
  const slug = params.slug as string;

  const [targets, setTargets] = useState<
    { label: string; value: number; unit?: string }[]
  >([]);
  const [recent, setRecent] = useState<
    { date: string; summary: string }[]
  >([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tmod = await import("@/assets/data/targets.json");
        const hmod = await import("@/assets/data/history.json");
        if (!mounted) return;
        const tentry = (tmod as any).default.find((e: any) => e.slug === slug);
        const hentry = (hmod as any).default.find((e: any) => e.slug === slug);
        setTargets(tentry?.targets ?? []);
        setRecent(hentry?.recent ?? []);
      } catch {
        // swallow for mock data
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Routine</Text>
      <ProgressView slug={slug} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Targets</Text>
        {targets.length === 0 ? (
          <Text style={styles.muted}>No targets set.</Text>
        ) : (
          <View style={styles.listVGap}>
            {targets.map((t, i) => (
              <View key={i} style={styles.rowBetween}>
                <Text style={styles.itemText}>{t.label}</Text>
                <Text style={styles.itemText}>
                  {t.value}
                  {t.unit ? ` ${t.unit}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent history</Text>
        {recent.length === 0 ? (
          <Text style={styles.muted}>No sessions yet.</Text>
        ) : (
          <View style={styles.listVGap}>
            {recent.map((r, i) => (
              <View key={i} style={styles.vItem}>
                <Text style={styles.itemSubtle}>{r.date}</Text>
                <Text style={styles.itemText}>{r.summary}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        onPress={() => {
          // placeholder action for now
          console.log("Start session for", slug);
        }}
      >
        <Text style={styles.ctaText}>Start session</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  muted: {
    color: theme.colors.muted,
  },
  listVGap: {
    gap: theme.spacing.sm,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vItem: {
    gap: 2,
  },
  itemText: {
    color: theme.colors.text,
  },
  itemSubtle: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  cta: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: theme.colors.primaryTextOn,
    fontWeight: "600",
  },
});
