import {
  NoChallengesEmpty,
  NoSearchResultsEmpty,
} from "@/components/common/EmptyState";
import { SkeletonChallengeButton } from "@/components/common/Skeleton";
import { useChallenges } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { StyleSheet, Text, View } from "react-native";
import SwipeableChallengeButton from "./SwipeableChallengeButton";

type Props = {
  query?: string;
};

export default function ChallengesView({ query }: Props) {
  const { data, loading, error } = useChallenges();

  if (loading) {
    return (
      <View style={styles.listContainer}>
        <SkeletonChallengeButton />
        <SkeletonChallengeButton />
        <SkeletonChallengeButton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Failed to load challenges.</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return <NoChallengesEmpty />;
  }

  const filtered = query
    ? data.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
    : data;

  if (filtered.length === 0) {
    return <NoSearchResultsEmpty query={query || ""} />;
  }

  return (
    <View style={styles.listContainer}>
      {filtered.map((challenge, i) => (
        <SwipeableChallengeButton
          label={challenge.name}
          key={i}
          slug={challenge.slug}
        />
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
