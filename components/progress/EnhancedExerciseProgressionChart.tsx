/**
 * Enhanced Exercise Progression Chart
 *
 * Features:
 * - Interactive exercise selection
 * - PR highlighting
 * - Multiple metrics (reps, weight, volume)
 */

import {
  useExerciseProgression,
  useExercisePRs,
  useExercisesWithProgression
} from '@/hooks/data'
import { useExercises } from '@/hooks/data/useExercises'
import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Exercise, PersonalRecord } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { CompactEmptyState } from './ProgressEmptyState'
import LineChart, { type DataPoint } from './LineChart'

type MetricType = 'reps' | 'weight' | 'volume'
type TimeRange = '7d' | '30d' | '90d'

const METRICS: { key: MetricType; label: string }[] = [
  { key: 'reps', label: 'Reps' },
  { key: 'weight', label: 'Weight' },
  { key: 'volume', label: 'Volume' }
]

const TIME_RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 }
]

const CHART_HEIGHT = 160

interface ChartProps {
  selectedExerciseId?: string
  onExerciseChange?: (exerciseId: string) => void
}

export function EnhancedExerciseProgressionChart({
  selectedExerciseId: externalSelectedId,
  onExerciseChange
}: ChartProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null
  )
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('reps')
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const fadeAnim = useRef(new Animated.Value(0)).current

  // Use external ID if provided, otherwise use internal state
  const selectedExerciseId = externalSelectedId ?? internalSelectedId

  const { exerciseIds, loading: loadingExerciseIds } =
    useExercisesWithProgression()
  const { data: exercises, loading: loadingExercises } = useExercises()
  const days = TIME_RANGES.find(r => r.key === timeRange)?.days ?? 30
  const { data: progressionData, loading } = useExerciseProgression(
    selectedExerciseId,
    days
  )
  const { prs: exercisePRs } = useExercisePRs(selectedExerciseId ?? '')

  const catalogById = useMemo(() => {
    const map = new Map<string, Exercise>()
    exercises?.forEach((ex: Exercise) => map.set(ex.id, ex))
    return map
  }, [exercises])

  // The backend's exercisesWithData (exerciseIds) is the source of truth for
  // which exercises have progression. The local catalog is paginated, so we
  // resolve names from it opportunistically and fall back to the id rather than
  // hiding exercises that simply haven't been loaded into the catalog yet.
  const progressionExercises = useMemo(
    () =>
      exerciseIds.map(id => {
        const ex = catalogById.get(id)
        return { id, name: ex?.name ?? id, category: ex?.category ?? '' }
      }),
    [exerciseIds, catalogById]
  )

  const selectedExerciseName = selectedExerciseId
    ? (catalogById.get(selectedExerciseId)?.name ?? selectedExerciseId)
    : undefined

  // Auto-select first exercise when available and no selection
  useEffect(() => {
    if (!externalSelectedId && !internalSelectedId && exerciseIds.length > 0) {
      setInternalSelectedId(exerciseIds[0])
    }
  }, [externalSelectedId, internalSelectedId, exerciseIds])

  useEffect(() => {
    if (!loading && !loadingExerciseIds && !loadingExercises) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start()
    }
  }, [loading, loadingExerciseIds, loadingExercises, fadeAnim])

  const handleExerciseSelect = useCallback(
    (exerciseId: string) => {
      if (onExerciseChange) {
        onExerciseChange(exerciseId)
      } else {
        setInternalSelectedId(exerciseId)
      }
      setShowExerciseSelector(false)
      haptics.tabSwitch()
    },
    [onExerciseChange]
  )

  const handleMetricChange = useCallback((metric: MetricType) => {
    setSelectedMetric(metric)
    haptics.tabSwitch()
  }, [])

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range)
    haptics.tabSwitch()
  }, [])

  const chartData = useMemo(() => {
    if (!progressionData?.dataPoints.length) return null

    const { dataPoints, trend } = progressionData
    const values = dataPoints.map(dp => {
      switch (selectedMetric) {
        case 'weight':
          return dp.maxWeight ?? 0
        case 'volume':
          return dp.volume ?? 0
        default:
          return dp.reps
      }
    })
    const bars = dataPoints.map((point, index) => {
      const value = values[index]

      const isPR = exercisePRs.some((pr: PersonalRecord) => {
        const prDate = new Date(pr.achievedAt).toISOString().split('T')[0]
        return (
          prDate === point.date &&
          ((selectedMetric === 'reps' && pr.type === 'max_reps') ||
            (selectedMetric === 'weight' && pr.type === 'max_weight') ||
            (selectedMetric === 'volume' && pr.type === 'max_volume'))
        )
      })

      return { point, value, isPR }
    })

    return { bars, trend }
  }, [progressionData, selectedMetric, exercisePRs])

  const lineData: DataPoint[] = useMemo(
    () =>
      chartData?.bars.map(b => ({
        date: b.point.date,
        value: b.value,
        highlight: b.isPR
      })) ?? [],
    [chartData]
  )
  const metricUnit =
    selectedMetric === 'reps'
      ? 'reps'
      : selectedMetric === 'weight'
        ? 'kg'
        : 'vol'
  const currentValue = lineData.length
    ? lineData[lineData.length - 1].value
    : 0

  // Skeleton while the progression id list resolves. The catalog (names) is
  // not required to render — names fall back to ids — so don't block on it.
  if (loadingExerciseIds) {
    return (
      <View style={styles.card}>
        <View style={styles.skeleton} />
      </View>
    )
  }

  // Empty state - no exercises with progression
  if (progressionExercises.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons
              name="trending-up"
              size={18}
              color={theme.colors.primary}
              style={styles.titleIcon}
            />
            <Text style={styles.title}>Progression</Text>
          </View>
        </View>
        <CompactEmptyState
          message="Complete workouts to track progression"
          icon="bar-chart-outline"
        />
      </View>
    )
  }

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name="trending-up"
            size={18}
            color={theme.colors.primary}
            style={styles.titleIcon}
          />
          <Text style={styles.title}>Progression</Text>
        </View>
        {chartData?.trend && (
          <View style={styles.trendBadge}>
            <Ionicons
              name={
                chartData.trend.direction === 'up'
                  ? 'arrow-up'
                  : chartData.trend.direction === 'down'
                    ? 'arrow-down'
                    : 'remove'
              }
              size={12}
              color={
                chartData.trend.direction === 'up'
                  ? theme.colors.success
                  : chartData.trend.direction === 'down'
                    ? theme.colors.danger
                    : theme.colors.muted
              }
            />
            <Text
              style={[
                styles.trendText,
                {
                  color:
                    chartData.trend.direction === 'up'
                      ? theme.colors.success
                      : chartData.trend.direction === 'down'
                        ? theme.colors.danger
                        : theme.colors.muted
                }
              ]}
            >
              {chartData.trend.direction === 'stable'
                ? 'Stable'
                : `${chartData.trend.percentChange.toFixed(0)}%`}
            </Text>
          </View>
        )}
      </View>

      {/* Exercise Selector */}
      <Pressable
        style={({ pressed }) => [
          styles.exerciseSelector,
          pressed && styles.exerciseSelectorPressed
        ]}
        onPress={() => setShowExerciseSelector(true)}
      >
        <Text
          style={[
            styles.exerciseSelectorText,
            !selectedExerciseName && styles.exerciseSelectorPlaceholder
          ]}
          numberOfLines={1}
        >
          {selectedExerciseName ?? 'Select exercise'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
      </Pressable>

      {/* Controls Row - Combined metric and time range */}
      <View style={styles.controlsRow}>
        <View style={styles.segmentedControl}>
          {METRICS.map(m => {
            const isDisabled =
              m.key === 'weight' && !progressionData?.hasWeightData
            const isActive = selectedMetric === m.key
            return (
              <Pressable
                key={m.key}
                style={[
                  styles.segment,
                  isActive && styles.segmentActive,
                  isDisabled && styles.segmentDisabled
                ]}
                onPress={() => !isDisabled && handleMetricChange(m.key)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isActive && styles.segmentTextActive,
                    isDisabled && styles.segmentTextDisabled
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.timeRangeControl}>
          {TIME_RANGES.map(r => {
            const isActive = timeRange === r.key
            return (
              <Pressable
                key={r.key}
                style={[styles.timeChip, isActive && styles.timeChipActive]}
                onPress={() => handleTimeRangeChange(r.key)}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    isActive && styles.timeChipTextActive
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Chart Area */}
      {!selectedExerciseId ? (
        <CompactEmptyState
          message="Select an exercise to view chart"
          icon="bar-chart-outline"
        />
      ) : loading ? (
        <View style={styles.chartLoadingArea}>
          <View style={styles.chartLoadingSkeleton} />
        </View>
      ) : !chartData ? (
        <CompactEmptyState
          message="No data for this period"
          icon="calendar-outline"
        />
      ) : (
        <View style={styles.chartArea}>
          <View style={styles.currentValueRow}>
            <Text style={styles.currentValue}>{currentValue}</Text>
            <Text style={styles.currentUnit}>{metricUnit}</Text>
          </View>
          <LineChart
            data={lineData}
            color={theme.colors.primary}
            height={CHART_HEIGHT}
            showDots={lineData.length <= 14}
            valueFormatter={v => String(Math.round(v))}
          />
        </View>
      )}

      {/* Exercise Selector Modal */}
      <Modal
        visible={showExerciseSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <Pressable
              onPress={() => setShowExerciseSelector(false)}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.modalCloseButtonPressed
              ]}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.exerciseList}
            contentContainerStyle={styles.exerciseListContent}
          >
            {progressionExercises.map(exercise => {
              const isSelected = selectedExerciseId === exercise.id
              return (
                <Pressable
                  key={exercise.id}
                  style={({ pressed }) => [
                    styles.exerciseItem,
                    isSelected && styles.exerciseItemSelected,
                    pressed && styles.exerciseItemPressed
                  ]}
                  onPress={() => handleExerciseSelect(exercise.id)}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {exercise.category ? (
                      <Text style={styles.exerciseCategory}>
                        {exercise.category}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      </Modal>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  titleIcon: {
    marginRight: theme.spacing.xs
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full
  },
  trendText: {
    ...theme.typography.caption,
    fontFamily: theme.fonts.semiBold
  },
  exerciseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md
  },
  exerciseSelectorPressed: {
    opacity: 0.7
  },
  exerciseSelectorText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium,
    flex: 1
  },
  exerciseSelectorPlaceholder: {
    color: theme.colors.muted
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.sm,
    padding: 2
  },
  segment: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.xs
  },
  segmentActive: {
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm
  },
  segmentDisabled: {
    opacity: 0.4
  },
  segmentText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  segmentTextDisabled: {
    color: theme.colors.muted
  },
  timeRangeControl: {
    flexDirection: 'row',
    gap: theme.spacing.xs
  },
  timeChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm
  },
  timeChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.sm
  },
  timeChipText: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    fontFamily: theme.fonts.medium
  },
  timeChipTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.semiBold
  },
  chartArea: {
    marginTop: theme.spacing.sm
  },
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm
  },
  currentValue: {
    fontFamily: theme.fonts.displayMed,
    fontSize: 28,
    color: theme.colors.text,
    letterSpacing: -0.5
  },
  currentUnit: {
    ...theme.typography.caption,
    color: theme.colors.subtext
  },
  skeleton: {
    height: 280,
    backgroundColor: theme.colors.skeleton,
    borderRadius: theme.radius.sm
  },
  chartLoadingArea: {
    height: CHART_HEIGHT + 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chartLoadingSkeleton: {
    width: '100%',
    height: CHART_HEIGHT,
    backgroundColor: theme.colors.skeleton,
    borderRadius: theme.radius.sm
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  modalTitle: {
    ...theme.typography.h2,
    color: theme.colors.text
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCloseButtonPressed: {
    backgroundColor: theme.colors.background
  },
  exerciseList: {
    flex: 1
  },
  exerciseListContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  exerciseItemSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  exerciseItemPressed: {
    opacity: 0.7
  },
  exerciseInfo: {
    flex: 1
  },
  exerciseName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: theme.fonts.medium
  },
  exerciseCategory: {
    ...theme.typography.caption,
    color: theme.colors.muted,
    textTransform: 'capitalize',
    marginTop: 2
  }
})
