import { ConfettiCelebration, StepCard } from "@/components";
import { useDataActions } from "@/context/DataContext";
import { useProgramSessions } from "@/hooks/data";
import { useSessionSteps, useSessionTimer } from "@/hooks/session";
import { formatTime } from "@/lib/utils/format";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SessionDetail() {
  const params = useLocalSearchParams();
  const slug = params.slug as string;
  const index = Number(params.index);

  // Data context actions
  const actions = useDataActions();

  const { program, sessions, loading, error } = useProgramSessions(slug);
  const session = useMemo(() => sessions.find((s) => s.index === index), [sessions, index]);

  // Use the timer hook
  const timer = useSessionTimer({
    slug,
    session,
    program,
    actions,
  });

  const {
    phase,
    currentSet,
    timer: timerValue,
    isPaused,
    showConfetti,
    progress,
    warmUpSeconds,
    breakSeconds,
    handlePauseResume,
    handleSkip,
    handleComplete,
    setShowConfetti,
  } = timer;

  const { steps, currentStepIndex, totalSets, completedSets } = useSessionSteps(
    warmUpSeconds,
    breakSeconds,
    session,
    phase,
    currentSet
  );

  // Auto-scroll to active step
  const listRef = useRef<FlatList<any> | null>(null);
  useEffect(() => {
    if (!listRef.current) return;
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) return;
    try {
      listRef.current.scrollToIndex({ index: currentStepIndex, animated: true, viewPosition: 0.5 });
    } catch {}
  }, [currentStepIndex, steps.length]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </View>
    );
  }
  if (error || !program || !session) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.muted}>Session unavailable.</Text>
        </View>
      </View>
    );
  }

  const phaseBg = phase === "warmup" ? theme.colors.phases.warmupBg : phase === "working" ? theme.colors.phases.workingBg : phase === "break" ? theme.colors.phases.breakBg : theme.colors.phases.doneBg;
  const phaseFg = phase === "warmup" ? theme.colors.phases.warmup : phase === "working" ? theme.colors.phases.working : phase === "break" ? theme.colors.phases.break : theme.colors.phases.done;

  return (
    <View style={styles.container}>
      {/* Confetti Celebration */}
      <ConfettiCelebration
        show={showConfetti}
        onComplete={() => setShowConfetti(false)}
        message="Session Complete! 🎉"
        subMessage="You're crushing it!"
      />

      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{program.exercise.name}</Text>
              <Text style={styles.subtitle}>Session {session.index} • {session.totalReps} reps total</Text>
            </View>
            <View style={[styles.phaseChip, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <View style={[styles.phaseChipDot, { backgroundColor: phaseFg }]} />
              <Text style={[styles.phaseChipText, { color: phaseFg }]}>
                {phase === "warmup" ? "Warm-up" : phase === "working" ? "Working" : phase === "break" ? "Break" : "Done"}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{completedSets}/{totalSets} sets</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: phaseFg }]} />
            </View>
          </View>
        </View>

        {/* Focus Card */}
        {phase !== "working" && phase !== "done" ? (
          <View style={[styles.focusCard, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
            <Text style={[styles.timerHero, { color: phaseFg }]}>{formatTime(timerValue)}</Text>
            <Text style={styles.focusLabel}>
              {phase === "warmup" ? "Get ready for your workout" : `Rest after set ${currentSet}`}
            </Text>
          </View>
        ) : (
          <View style={styles.focusRow}>
            <View style={[styles.infoPill, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <Ionicons name="barbell-outline" size={18} color={phaseFg} />
              <Text style={[styles.infoPillText, { color: phaseFg }]}>Set {currentSet}/{session.sets.length}</Text>
            </View>
            <View style={[styles.infoPill, { backgroundColor: phaseBg, borderColor: phaseFg }]}>
              <Ionicons name="repeat-outline" size={18} color={phaseFg} />
              <Text style={[styles.infoPillText, { color: phaseFg }]}>{session.sets[currentSet - 1] ?? 0} reps</Text>
            </View>
          </View>
        )}

        {/* Steps List */}
        <FlatList
          ref={listRef}
          data={steps}
          keyExtractor={(item) => item.key}
          extraData={{ phase, timerValue, currentSet, isPaused, currentStepIndex }}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={(info) => {
            try {
              if (!listRef.current) return;
              const validIndex = Math.min(info.highestMeasuredFrameIndex, info.index);
              listRef.current.scrollToIndex({ index: Math.max(0, validIndex), animated: true });
            } catch {}
          }}
          renderItem={({ item, index: idx }) => {
            const isDone = idx < currentStepIndex;
            const isActive = idx === currentStepIndex && phase !== "done";
            const isLocked = idx > currentStepIndex || phase === "done";
            const rightTick = isDone ? <Text style={[styles.tick, { color: phaseFg }]}>✓</Text> : undefined;

            if (item.type === "warmup") {
              return (
                <StepCard title="Warm-up" active={isActive} done={isDone} locked={isLocked} right={rightTick}>
                  {isActive && phase === "warmup" && (
                    <Text style={styles.timerText}>{formatTime(timerValue)}</Text>
                  )}
                </StepCard>
              );
            }

            if (item.type === "set") {
              const setNum = item.set;
              return (
                <StepCard
                  title={`Set ${setNum} of ${session.sets.length}`}
                  active={isActive}
                  done={isDone || (phase === "done" && idx < steps.length)}
                  locked={isLocked}
                  right={(isDone || (phase === "done" && idx < steps.length)) ? <Text style={styles.tick}>✓</Text> : undefined}
                >
                  <View style={styles.setPill}>
                    <Text style={styles.setPillText}>{item.reps} reps</Text>
                  </View>
                </StepCard>
              );
            }

            // break
            const after = item.afterSet;
            const isCurrentBreak = isActive && phase === "break" && currentSet === after;
            return (
              <StepCard title="Break" active={isActive} done={isDone} locked={isLocked} right={rightTick}>
                {isCurrentBreak && (
                  <Text style={styles.timerText}>{formatTime(timerValue)}</Text>
                )}
              </StepCard>
            );
          }}
          ListFooterComponent={
            phase === "done" ? (
              <View style={styles.doneCard}>
                <View style={styles.doneIconContainer}>
                  <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
                </View>
                <Text style={styles.doneTitle}>Session Complete!</Text>
                <Text style={styles.doneSubtitle}>Great job finishing your workout</Text>
                <Pressable
                  style={({ pressed }) => [styles.doneButton, pressed && styles.buttonPressed]}
                  onPress={() => router.back()}
                >
                  <Ionicons name="arrow-back" size={18} color={theme.colors.primaryTextOn} style={{ marginRight: theme.spacing.sm }} />
                  <Text style={styles.doneButtonText}>Back to Routine</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      </View>

      {/* Bottom Controls */}
      {phase !== "done" && (
        <SafeAreaView style={styles.footer}>
          <View style={styles.footerContent}>
            {/* Secondary actions row */}
            <View style={styles.secondaryRow}>
              <Pressable
                disabled={phase === "working"}
                onPress={handlePauseResume}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  (phase === "working") && styles.btnDisabled,
                  pressed && styles.secondaryBtnPressed,
                ]}
              >
                <Ionicons
                  name={isPaused ? "play" : "pause"}
                  size={20}
                  color={phase === "working" ? theme.colors.muted : theme.colors.text}
                />
                <Text style={[styles.secondaryBtnText, phase === "working" && styles.textDisabled]}>
                  {isPaused ? "Resume" : "Pause"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSkip}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.secondaryBtnPressed,
                ]}
              >
                <Ionicons name="play-skip-forward" size={20} color={theme.colors.text} />
                <Text style={styles.secondaryBtnText}>Skip</Text>
              </Pressable>
            </View>

            {/* Primary action */}
            <Pressable
              disabled={phase !== "working"}
              onPress={handleComplete}
              style={({ pressed }) => [
                styles.primaryBtn,
                phase !== "working" && styles.primaryBtnDisabled,
                pressed && phase === "working" && styles.primaryBtnPressed,
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={theme.colors.primaryTextOn}
                style={{ marginRight: theme.spacing.sm }}
              />
              <Text style={styles.primaryBtnText}>
                {phase === "working" ? `Complete Set ${currentSet}` : phase === "warmup" ? "Warming up..." : "Resting..."}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: theme.radius.full,
    borderWidth: 1,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  phaseChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  phaseChipText: {
    ...theme.typography.caption,
    fontWeight: "600",
  },
  progressSection: {
    gap: theme.spacing.xs,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
  },
  progressValue: {
    ...theme.typography.caption,
    fontWeight: "600",
    color: theme.colors.subtext,
  },
  progressBarTrack: {
    height: 8,
    width: "100%",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.card,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: theme.radius.sm,
  },
  focusCard: {
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    ...theme.shadows.md,
  },
  timerHero: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginBottom: theme.spacing.xs,
  },
  focusLabel: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  infoPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  infoPillText: {
    ...theme.typography.bodyBold,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 200,
  },
  timerText: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    marginTop: theme.spacing.xs,
  },
  setPill: {
    alignSelf: "flex-start",
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  setPillText: {
    ...theme.typography.caption,
    color: theme.colors.text,
  },
  tick: {
    color: theme.colors.success,
    fontWeight: "700",
    fontSize: 18,
  },
  muted: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  doneCard: {
    backgroundColor: theme.colors.successLight,
    borderColor: theme.colors.success,
    borderWidth: 1,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: "center",
    ...theme.shadows.md,
  },
  doneIconContainer: {
    marginBottom: theme.spacing.md,
  },
  doneTitle: {
    ...theme.typography.h2,
    color: theme.colors.success,
    marginBottom: theme.spacing.xs,
  },
  doneSubtitle: {
    ...theme.typography.body,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.lg,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    ...theme.shadows.md,
  },
  doneButtonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
  },

  // Footer styles
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    ...theme.shadows.lg,
  },
  footerContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  secondaryRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.card,
  },
  secondaryBtnPressed: {
    backgroundColor: theme.colors.border,
    transform: [{ scale: 0.98 }],
  },
  secondaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  primaryBtnDisabled: {
    backgroundColor: theme.colors.muted,
  },
  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn,
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: theme.colors.muted,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
