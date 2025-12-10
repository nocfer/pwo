import { useRoutines } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";
import { NoRoutinesEmpty, NoSearchResultsEmpty } from "@/components/common/EmptyState";
import { SkeletonRoutineButton } from "@/components/common/Skeleton";
import SwipeableRoutineButton from "./SwipeableRoutineButton";

type Props = {
  query?: string;
};

export default function RoutinesView({ query }: Props) {
  const { data, loading, error } = useRoutines();

  if (loading) {
    return (
      <View style={styles.listContainer}>
        <SkeletonRoutineButton />
        <SkeletonRoutineButton />
        <SkeletonRoutineButton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Failed to load routines.</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return <NoRoutinesEmpty />;
  }

  const filtered = query
    ? data.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : data;

  if (filtered.length === 0) {
    return <NoSearchResultsEmpty query={query || ""} />;
  }

  return (
    <View style={styles.listContainer}>
      {filtered.map((routine, i) => (
        <SwipeableRoutineButton label={routine.name} key={i} slug={routine.slug} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  listContainer: {
    gap: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.subtext,
  },
});
