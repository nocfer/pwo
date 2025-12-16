import { ErrorScreen, LoadingScreen, ScreenHeader } from "@/components";
import ChallengeView from "@/components/challenge/ChallengeView";
import ProgramView from "@/components/program/ProgramView";
import {
  useChallengeProgress,
  useChallengeSessions,
  useProgramProgress,
  usePrograms
} from "@/hooks/data";
import { theme } from "@/theme/theme";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgramDetail() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { data: programs, loading } = usePrograms();

  const program = useMemo(
    () => programs?.find((p) => p.id === id) ?? null,
    [programs, id]
  );

  // Get sessions (generated dynamically for challenge programs)
  const sessions = useChallengeSessions(program);
  const isChallenge = Boolean(program?.challengeConfig);
  const { metrics: challengeMetrics } = useChallengeProgress(
    isChallenge ? program : undefined
  );
  const { metrics: programMetrics } = useProgramProgress(
    !isChallenge ? program : undefined
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (!program) {
    return <ErrorScreen message="Program not found." />;
  }

  const subtitle = program.description
    ? program.description
    : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <ScreenHeader title={program.name} subtitle={subtitle} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {isChallenge && (
          <ChallengeView
            challengeMetrics={challengeMetrics!}
            program={program}
          />
        )}
        {programMetrics && (
          <ProgramView program={program} programMetrics={programMetrics!} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl
  }
});
