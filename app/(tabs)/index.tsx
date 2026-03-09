import { WeeklyChart } from '@/components'
import { AnimatedCard, EmptyState } from '@/components/common'
import { useAllProgress, usePrograms, useWeeklyActivity } from '@/hooks/data'
import {
  AnimatedIcon,
  useScreenIconAnimation
} from '@/hooks/useScreenIconAnimation'
import {
  prioritizePrograms,
  type ProgramWithPriority
} from '@/lib/utils/programPrioritization'
import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
  const { data: programs } = usePrograms()
  const [programSelectorOpen, setProgramSelectorOpen] = useState(false)
  const [prioritizedPrograms, setPrioritizedPrograms] = useState<
    ProgramWithPriority[]
  >([])

  const { data: aggregated } = useAllProgress()

  useEffect(() => {
    if (programs) {
      setPrioritizedPrograms(
        prioritizePrograms(programs, aggregated?.recentActivity ?? [])
      )
    } else {
      setPrioritizedPrograms([])
    }
  }, [programs, aggregated])

  const { regularPrograms, allPrograms } = useMemo(() => {
    if (prioritizedPrograms.length === 0) {
      return { regularPrograms: [], allPrograms: [] }
    }

    const regular = prioritizedPrograms.filter(p => !p.challengeConfig)
    const all = [...regular]

    return {
      regularPrograms: regular,
      allPrograms: all
    }
  }, [prioritizedPrograms])

  const { data: weeklyData } = useWeeklyActivity()

  const handleProgramSelect = (program: ProgramWithPriority) => {
    setProgramSelectorOpen(false)
    router.navigate({ pathname: '/programs/[id]', params: { id: program.id } })
  }

  const handleQuickStart = () => {
    if (allPrograms.length === 1) {
      handleProgramSelect(allPrograms[0])
    } else if (allPrograms.length > 1) {
      setProgramSelectorOpen(true)
    }
  }

  const { trigger, staggerDelay } = useScreenIconAnimation({
    icons: [
      { type: 'pulse', duration: 500 },
      { type: 'rotate', duration: 400 },
      { type: 'bounceY', duration: 450 },
      { type: 'slideX', duration: 400 }
    ],
    staggerDelay: 80
  })

  const hasProgress = aggregated && aggregated.totalWorkoutsCompleted > 0

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.subtitle}>Ready to crush your workout?</Text>
        </View>

        <View style={styles.content}>
          {/* Quick Start Hero */}
          {allPrograms.length > 0 && (
            <AnimatedCard>
              <Pressable
                onPress={handleQuickStart}
                style={({ pressed }) => [
                  styles.heroCard,
                  pressed && styles.heroCardPressed
                ]}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroIconContainer}>
                    <AnimatedIcon
                      config={{ type: 'pulse', duration: 500 }}
                      trigger={trigger}
                      index={0}
                      staggerDelay={staggerDelay}
                    >
                      <Ionicons
                        name="play"
                        size={28}
                        color={theme.colors.primaryTextOn}
                      />
                    </AnimatedIcon>
                  </View>
                  <View style={styles.heroTextContainer}>
                    <Text style={styles.heroTitle}>
                      {allPrograms.length === 1
                        ? 'Start Workout'
                        : 'Quick Start'}
                    </Text>
                    <Text style={styles.heroSubtitle}>
                      {allPrograms.length === 1
                        ? allPrograms[0].name
                        : `${allPrograms.length} programs available`}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={theme.colors.primaryTextOn}
                />
              </Pressable>
            </AnimatedCard>
          )}

          {/* Stats Row */}
          {hasProgress && (
            <AnimatedCard delay={50}>
              <View style={styles.statsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.statCard,
                    pressed && styles.statCardPressed
                  ]}
                  onPress={() => router.navigate('/(tabs)/progress')}
                >
                  <View style={styles.statIconContainer}>
                    <AnimatedIcon
                      config={{ type: 'rotate', duration: 400 }}
                      trigger={trigger}
                      index={1}
                      staggerDelay={staggerDelay}
                    >
                      <Ionicons
                        name="fitness"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </AnimatedIcon>
                  </View>
                  <Text style={styles.statValue}>
                    {aggregated.totalWorkoutsCompleted}
                  </Text>
                  <Text style={styles.statLabel}>workouts</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.statCard,
                    pressed && styles.statCardPressed
                  ]}
                  onPress={() => router.navigate('/(tabs)/progress')}
                >
                  <View
                    style={[
                      styles.statIconContainer,
                      { backgroundColor: theme.colors.accentLight }
                    ]}
                  >
                    <AnimatedIcon
                      config={{ type: 'bounceY', duration: 450 }}
                      trigger={trigger}
                      index={2}
                      staggerDelay={staggerDelay}
                    >
                      <Ionicons
                        name="flame"
                        size={20}
                        color={theme.colors.accent}
                      />
                    </AnimatedIcon>
                  </View>
                  <Text style={styles.statValue}>
                    {aggregated.currentStreak}
                  </Text>
                  <Text style={styles.statLabel}>day streak</Text>
                </Pressable>
              </View>
            </AnimatedCard>
          )}

          {/* Weekly Activity */}
          <AnimatedCard delay={100}>
            <WeeklyChart data={weeklyData} title="This Week" />
          </AnimatedCard>

          {/* Browse Programs */}
          <AnimatedCard delay={150}>
            <Pressable
              style={({ pressed }) => [
                styles.browseCard,
                pressed && styles.browseCardPressed
              ]}
              onPress={() => router.navigate('/(tabs)/library')}
            >
              <View style={styles.browseContent}>
                <View style={styles.browseIconContainer}>
                  <AnimatedIcon
                    config={{ type: 'slideX', duration: 400 }}
                    trigger={trigger}
                    index={3}
                    staggerDelay={staggerDelay}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={22}
                      color={theme.colors.primary}
                    />
                  </AnimatedIcon>
                </View>
                <View style={styles.browseTextContainer}>
                  <Text style={styles.browseTitle}>Browse Library</Text>
                  <Text style={styles.browseSubtitle}>
                    Programs & exercises
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.muted}
              />
            </Pressable>
          </AnimatedCard>

          {/* Empty State */}
          {allPrograms.length === 0 && (
            <AnimatedCard delay={150}>
              <EmptyState
                variant="default"
                icon="barbell-outline"
                title="No programs yet"
                description="Create your first program to get started"
                actionLabel="Go to Library"
                onAction={() => router.navigate('/(tabs)/library')}
              />
            </AnimatedCard>
          )}
        </View>
      </ScrollView>

      {/* Program Selector Modal */}
      <Modal
        visible={programSelectorOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setProgramSelectorOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setProgramSelectorOpen(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Program</Text>
            </View>

            <ScrollView
              style={styles.programList}
              showsVerticalScrollIndicator={false}
            >
              <ProgramSection
                label="Programs"
                programs={regularPrograms}
                icon="barbell"
                iconColor={theme.colors.primary}
                iconBgColor={theme.colors.primaryLight}
                onSelect={handleProgramSelect}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

function ProgramSection({
  label,
  programs,
  icon,
  iconColor,
  iconBgColor,
  onSelect
}: {
  label: string
  programs: ProgramWithPriority[]
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBgColor: string
  onSelect: (program: ProgramWithPriority) => void
}) {
  if (programs.length === 0) return null

  return (
    <View style={styles.programSection}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {programs.map(program => (
        <Pressable
          key={program.id}
          onPress={() => onSelect(program)}
          style={({ pressed }) => [
            styles.programItem,
            pressed && styles.programItemPressed
          ]}
        >
          <View style={[styles.programIcon, { backgroundColor: iconBgColor }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          <View style={styles.programInfo}>
            <Text style={styles.programName} numberOfLines={1}>
              {program.name}
            </Text>
            {program.description && (
              <Text style={styles.programDescription} numberOfLines={1}>
                {program.description}
              </Text>
            )}
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.colors.muted}
          />
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scrollView: {
    flex: 1
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg
  },
  greeting: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
    gap: theme.spacing.md
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg
  },
  heroCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }]
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroTextContainer: {
    flex: 1,
    gap: theme.spacing.xs
  },
  heroTitle: {
    ...theme.typography.h2,
    color: theme.colors.primaryTextOn
  },
  heroSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.primaryTextOn,
    opacity: 0.85
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center'
  },
  statCardPressed: {
    transform: [{ scale: 0.98 }]
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm
  },
  statValue: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  browseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg
  },
  browseCardPressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }]
  },
  browseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1
  },
  browseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  browseTextContainer: {
    flex: 1,
    gap: 2
  },
  browseTitle: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  browseSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '70%',
    paddingBottom: theme.spacing.xxl
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm
  },
  modalHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center'
  },
  programList: {
    paddingHorizontal: theme.spacing.lg
  },
  programSection: {
    marginTop: theme.spacing.lg
  },
  sectionLabel: {
    ...theme.typography.small,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md
  },
  programItemPressed: {
    backgroundColor: theme.colors.background
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  programInfo: {
    flex: 1,
    gap: 2
  },
  programName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text
  },
  programDescription: {
    ...theme.typography.caption,
    color: theme.colors.muted
  }
})
