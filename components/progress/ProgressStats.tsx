import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
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
            columns === 3 && styles.statItemThreeColumns
          ]}
        >
          {stat.icon && (
            <View style={styles.iconRow}>
              <Ionicons
                name={stat.icon as any}
                size={18}
                color={theme.colors.primary}
                style={{ marginRight: theme.spacing.xs }}
              />
              <Text style={styles.label}>{stat.label}</Text>
            </View>
          )}
          {!stat.icon && <Text style={styles.label}>{stat.label}</Text>}
          <Text style={styles.value}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
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
    ...theme.shadows.sm
  },
  statItemThreeColumns: {
    minWidth: "30%"
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs
  },
  value: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
    marginBottom: theme.spacing.xs
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center"
  }
});
