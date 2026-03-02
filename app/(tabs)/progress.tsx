/**
 * Statistics Tab - Unified progress and analytics dashboard
 * Consolidates progress tracking, consistency, PRs, and exercise progression
 */

import {
  ConsistencyHeatmap,
  EnhancedExerciseProgressionChart,
  PersonalRecordsCard,
  WeeklySummaryCard
} from '@/components'
import { Button } from '@/components/common'
import { type AggregatedProgress, useAllProgress } from '@/hooks/data'
import {
  AnimatedIcon,
  useScreenIconAnimation
} from '@/hooks/useScreenIconAnimation'
import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SECTION_COUNT = 5
const ANIMATION_DURATION = 250
const ANIMATION_STAGGER = 80

function generateProgressReport(progressData: AggregatedProgress): string {
  const totalMinutes = Math.round(progressData.totalTimeSpentSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `🏋️ Fitness Progress Report

📊 Overall Stats:
• Workouts: ${progressData.totalWorkoutsCompleted}
• Total Reps: ${progressData.totalRepsCompleted}
• Time: ${hours}h ${minutes}m
• Streak: ${progressData.currentStreak} days

Generated on ${new Date().toLocaleDateString()}`
}

export default function StatisticsScreen() {
  const [refreshing, setRefreshing] = useState(false)
  const { data: allProgress } = useAllProgress()

  const { trigger, staggerDelay } = useScreenIconAnimation({
    icons: [
      { type: 'pulse', duration: 500 },
      { type: 'bounceY', duration: 450 },
      { type: 'spin', duration: 500 },
      { type: 'clockwise', duration: 600 }
    ],
    staggerDelay: 80
  })

  const sectionAnims = useRef(
    Array.from({ length: SECTION_COUNT }, () => new Animated.Value(0))
  ).current

  const animateSections = useCallback(() => {
    Animated.stagger(
      ANIMATION_STAGGER,
      sectionAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true
        })
      )
    ).start()
  }, [sectionAnims])

  const resetAnimations = useCallback(() => {
    sectionAnims.forEach(anim => anim.setValue(0))
  }, [sectionAnims])

  useEffect(() => {
    animateSections()
  }, [animateSections])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    haptics.refresh()
    resetAnimations()

    await new Promise(resolve => setTimeout(resolve, 400))

    setRefreshing(false)
    animateSections()
  }, [animateSections, resetAnimations])

  const handleShareReport = useCallback(async () => {
    try {
      haptics.shareData()
      if (!allProgress) return
      const report = generateProgressReport(allProgress)
      await Share.share({ message: report, title: 'Progress Report' })
    } catch {
      // Share cancelled or failed
    }
  }, [allProgress])

  const animatedStyles = sectionAnims.map(anim => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0]
        })
      }
    ]
  }))

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.subtitle}>Your fitness insights</Text>
        </View>

        {/* Weekly Summary */}
        <Animated.View style={[styles.section, animatedStyles[0]]}>
          <WeeklySummaryCard />
        </Animated.View>

        {/* Overall Stats */}
        <Animated.View style={[styles.section, animatedStyles[1]]}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Overall Progress</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="fitness"
                label="Total Workouts"
                value={allProgress?.totalWorkoutsCompleted ?? 0}
                color={theme.colors.primary}
                animationConfig={{ type: 'pulse', duration: 500 }}
                trigger={trigger}
                index={0}
                staggerDelay={staggerDelay}
              />
              <StatCard
                icon="flame"
                label="Current Streak"
                value={allProgress?.currentStreak ?? 0}
                color={theme.colors.accent}
                animationConfig={{ type: 'bounceY', duration: 450 }}
                trigger={trigger}
                index={1}
                staggerDelay={staggerDelay}
              />
              <StatCard
                icon="barbell"
                label="Total Reps"
                value={allProgress?.totalRepsCompleted ?? 0}
                color={theme.colors.phases.working}
                animationConfig={{ type: 'spin', duration: 500 }}
                trigger={trigger}
                index={2}
                staggerDelay={staggerDelay}
              />
              <StatCard
                icon="time"
                label="Active Workouts"
                value={allProgress?.activeWorkouts ?? 0}
                color={theme.colors.success}
                animationConfig={{ type: 'clockwise', duration: 600 }}
                trigger={trigger}
                index={3}
                staggerDelay={staggerDelay}
              />
            </View>
          </View>
        </Animated.View>

        {/* Consistency Heatmap */}
        <Animated.View style={[styles.section, animatedStyles[2]]}>
          <ConsistencyHeatmap weeks={12} />
        </Animated.View>

        {/* Personal Records */}
        <Animated.View style={[styles.section, animatedStyles[3]]}>
          <PersonalRecordsCard limit={5} />
        </Animated.View>

        {/* Exercise Progression */}
        <Animated.View style={[styles.section, animatedStyles[4]]}>
          <EnhancedExerciseProgressionChart />
        </Animated.View>

        {/* Export Section */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Share Progress</Text>
            <Button
              label="Share Report"
              variant="secondary"
              size="md"
              onPress={handleShareReport}
              icon="share-social"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  animationConfig,
  trigger,
  index,
  staggerDelay
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: number
  color: string
  animationConfig: import('@/hooks/useScreenIconAnimation').IconAnimationConfig
  trigger: import('react-native-reanimated').SharedValue<number>
  index: number
  staggerDelay: number
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <AnimatedIcon
          config={animationConfig}
          trigger={trigger}
          index={index}
          staggerDelay={staggerDelay}
        >
          <Ionicons name={icon} size={20} color={color} />
        </AnimatedIcon>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2
  },
  header: {
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted
  },
  section: {
    marginTop: theme.spacing.lg
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm
  },
  statValue: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textAlign: 'center'
  }
})
