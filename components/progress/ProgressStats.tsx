import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";

type StatItem = {
  label: string;
  value: string | number;
  icon?: string;
};

type Props = {
  stats: StatItem[];
  columns?: 2 | 3;
};

export default function ProgressStats({ stats, columns = 2 }: Props) {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[
            styles.statItem,
            columns === 3 && styles.statItemThreeColumns,
          ]}
        >
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  statItemThreeColumns: {
    minWidth: "30%",
  },
  value: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs,
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center",
  },
});
