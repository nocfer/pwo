import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type StatItem = {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
};

type Props = {
  stats: StatItem[];
  columns?: 2 | 3;
  compact?: boolean;
};

export default function ProgressStats({
  stats,
  columns = 2,
  compact = false
}: Props) {
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[
              styles.compactItem,
              index < stats.length - 1 && styles.compactItemBorder
            ]}
          >
            <Text style={styles.compactValue}>{stat.value}</Text>
            <Text style={styles.compactLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  }

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
            <View
              style={[
                styles.iconContainer,
                stat.color && { backgroundColor: `${stat.color}15` }
              ]}
            >
              <Ionicons
                name={stat.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                color={stat.color || theme.colors.primary}
              />
            </View>
          )}
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
    gap: theme.spacing.sm
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center"
  },
  statItemThreeColumns: {
    minWidth: "30%"
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm
  },
  value: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: "center"
  },
  compactContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm
  },
  compactItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: theme.spacing.xs
  },
  compactItemBorder: {
    borderRightWidth: 1,
    borderRightColor: theme.colors.borderLight
  },
  compactValue: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: 2
  },
  compactLabel: {
    ...theme.typography.small,
    color: theme.colors.muted
  }
});
