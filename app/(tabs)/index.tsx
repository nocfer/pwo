import { WeeklyChart } from '@/components'
import { AnimatedCard, EmptyState } from '@/components/common'
import { useAuth } from '@/context/AuthContext'
import {
  useAllProgress,
  usePrograms,
  useWeeklyActivity,
  useWeeklyStats
} from '@/hooks/data'
import { useResumableWorkout } from '@/hooks/workout'
import {
  AnimatedIcon,
  useScreenIconAnimation
} from '@/hooks/useScreenIconAnimation'
import { getInitials } from '@/lib/utils/format'
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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 18) return 'Afternoon'
  return 'Evening'
}

function getTodayLabel(): string {
  return new Date()
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
    .toUpperCase()
}

export default function Index() {
  const { user } = useAuth()
  const { workout: resumable, resume } = useResumableWorkout()
  const { data: programs } = usePrograms()
  const [programSelectorOpen, setProgramSelectorOpen] = useState(false)
  const [prioritizedPrograms, setPrioritizedPrograms] = useState<
    ProgramWithPriority[]
  >([])

  const { data: aggregated } = useAllProgress()
  const { stats: weeklyStats } = useWeeklyStats()

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
  const minutesThisWeek = Math.round(
    (weeklyStats?.totalTimeSeconds ?? 0) / 60
  )

  const userName =
    user?.displayName || user?.email?.split('@')[0] || 'there'
  const resumeProgress =
    resumable && resumable.totalSets > 0
      ? resumable.completedSets / resumable.totalSets
      : 0

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.dateLabel}>{getTodayLabel()}</Text>
            <Text style={styles.greeting}>
              {getGreeting()}, {userName}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userName)}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Resume / Start hero */}
          {resumable ? (
            <AnimatedCard>
              <Pressable
                onPress={resume}
                style={({ pressed }) => [
                  styles.heroCard,
                  pressed && styles.heroCardPressed
                ]}
              >
                <View style={styles.heroMain}>
                  <Text style={styles.heroLabel}>
                    PICK UP WHERE YOU LEFT OFF
                  </Text>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {resumable.sessionName}
                  </Text>
                  <Text style={styles.heroMeta} numberOfLines={1}>
                    {resumable.currentExerciseName} · Set{' '}
                    {resumable.setNumber} of {resumable.setCount}
                  </Text>
                  <View style={styles.heroProgressTrack}>
                    <View
                      style={[
                        styles.heroProgressFill,
                        { width: `${resumeProgress * 100}%` }
                      ]}
                    />
                  </View>
                  <View style={styles.heroFooterRow}>
                    <Text style={styles.heroFooterText}>
                      {resumable.completedSets} of {resumable.totalSets} sets
                    </Text>
                    <Text style={styles.heroFooterText}>
                      ~{resumable.minutesLeft} min left
                    </Text>
                  </View>
                </View>
                <View style={styles.heroPlayCircle}>
                  <Ionicons
                    name="play"
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
              </Pressable>
            </AnimatedCard>
          ) : (
            allPrograms.length > 0 && (
              <AnimatedCard>
                <Pressable
                  onPress={handleQuickStart}
                  style={({ pressed }) => [
                    styles.heroCard,
                    pressed && styles.heroCardPressed
                  ]}
                >
                  <View style={styles.heroMain}>
                    <Text style={styles.heroLabel}>
                      {"START TODAY'S SESSION"}
                    </Text>
                    <Text style={styles.heroTitle} numberOfLines={1}>
                      {allPrograms.length === 1
                        ? allPrograms[0].name
                        : 'Choose a program'}
                    </Text>
                    <Text style={styles.heroMeta} numberOfLines={1}>
                      {allPrograms.length === 1
                        ? 'Tap to begin'
                        : `${allPrograms.length} programs available`}
                    </Text>
                  </View>
                  <View style={styles.heroPlayCircle}>
                    <AnimatedIcon
                      config={{ type: 'pulse', duration: 500 }}
                      trigger={trigger}
                      index={0}
                      staggerDelay={staggerDelay}
                    >
                      <Ionicons
                        name="play"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </AnimatedIcon>
                  </View>
                </Pressable>
              </AnimatedCard>
            )
          )}

          {/* Stat strip */}
          {hasProgress && (
            <AnimatedCard delay={50}>
              <View style={styles.statsRow}>
                <StatTile
                  icon="fitness"
                  iconColor={theme.colors.primary}
                  iconBg={theme.colors.primaryLight}
                  value={aggregated.totalWorkoutsCompleted}
                  label="workouts"
                  onPress={() => router.navigate('/(tabs)/progress')}
                  animationConfig={{ type: 'rotate', duration: 400 }}
                  trigger={trigger}
                  index={1}
                  staggerDelay={staggerDelay}
                />
                <StatTile
                  icon="flame"
                  iconColor={theme.colors.accent}
                  iconBg={theme.colors.accentLight}
                  value={aggregated.currentStreak}
                  label="day streak"
                  onPress={() => router.navigate('/(tabs)/progress')}
                  animationConfig={{ type: 'bounceY', duration: 450 }}
                  trigger={trigger}
                  index={2}
                  staggerDelay={staggerDelay}
                />
                <StatTile
                  icon="time"
                  iconColor={theme.colors.info}
                  iconBg={theme.colors.infoLight}
                  value={minutesThisWeek}
                  label="min this week"
                  onPress={() => router.navigate('/(tabs)/progress')}
                  animationConfig={{ type: 'slideX', duration: 400 }}
                  trigger={trigger}
                  index={3}
                  staggerDelay={staggerDelay}
                />
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
                  <Ionicons
                    name="grid-outline"
                    size={22}
                    color={theme.colors.primary}
                  />
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
                actionLabel="Create a program"
                onAction={() => router.navigate('/library/programs/new')}
                secondaryActionLabel="Browse library"
                onSecondaryAction={() => router.navigate('/(tabs)/library')}
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

function StatTile({
  icon,
  iconColor,
  iconBg,
  value,
  label,
  onPress,
  animationConfig,
  trigger,
  index,
  staggerDelay
}: {
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  value: number
  label: string
  onPress: () => void
  animationConfig: import('@/hooks/useScreenIconAnimation').IconAnimationConfig
  trigger: import('react-native-reanimated').SharedValue<number>
  index: number
  staggerDelay: number
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.statCard,
        pressed && styles.statCardPressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
        <AnimatedIcon
          config={animationConfig}
          trigger={trigger}
          index={index}
          staggerDelay={staggerDelay}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </AnimatedIcon>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs
  },
  dateLabel: {
    ...theme.typography.small,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.session.limeMutedText,
    letterSpacing: 1.6,
    fontSize: 10
  },
  greeting: {
    ...theme.typography.h1,
    color: theme.colors.text
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.session.activeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.md
  },
  avatarText: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 15,
    color: theme.colors.primary
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
    gap: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg
  },
  heroCardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }]
  },
  heroMain: {
    flex: 1,
    gap: theme.spacing.xs
  },
  heroLabel: {
    ...theme.typography.small,
    fontFamily: theme.fonts.bold,
    color: theme.colors.primaryTextOn,
    letterSpacing: 1,
    opacity: 0.7,
    fontSize: 10
  },
  heroTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.primaryTextOn,
    letterSpacing: -0.3
  },
  heroMeta: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryTextOn,
    opacity: 0.75
  },
  heroProgressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primaryDark,
    overflow: 'hidden',
    marginTop: theme.spacing.sm
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.colors.primaryTextOn
  },
  heroFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs
  },
  heroFooterText: {
    ...theme.typography.small,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.primaryTextOn,
    opacity: 0.7
  },
  heroPlayCircle: {
    width: 54,
    height: 54,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryTextOn,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center'
  },
  statCardPressed: {
    transform: [{ scale: 0.98 }]
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm
  },
  statValue: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 22,
    color: theme.colors.text,
    marginBottom: 2
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.muted,
    textAlign: 'center'
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
