import {
  NoChallengesEmpty,
  NoSearchResultsEmpty,
} from "@/components/common/EmptyState";
import { SkeletonChallengeButton } from "@/components/common/Skeleton";
import { usePrograms } from "@/hooks/data";
import { theme } from "@/theme/theme";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import SwipeableChallengeButton from "./SwipeableChallengeButton";

type Props = {
  query?: string;
};

export default function ChallengesView({ query }: Props) {
  const { data: programs, loading, error } = usePrograms();

  // Filter for challenge programs (those with challengeConfig)
  const challenges = useMemo(() => {
    if (!programs) return [];
    return programs.filter((p) => p.challengeConfig);
  }, [programs]);

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

  if (!challenges || challenges.length === 0) {
    return <NoChallengesEmpty />;
  }

  const filtered = query
    ? challenges.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()),
      )
    : challenges;

  if (filtered.length === 0) {
    return <NoSearchResultsEmpty query={query || ""} />;
  }

  return (
    <View style={styles.listContainer}>
      {filtered.map((challenge, i) => (
        <SwipeableChallengeButton
          label={challenge.name}
          key={i}
          programId={challenge.id}
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
