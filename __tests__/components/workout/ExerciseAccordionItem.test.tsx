import { describe, expect, it, vi } from 'vitest'
import type { ExerciseState } from '@/types/workout'

import { ExerciseAccordionItem } from '@/components/workout/ExerciseAccordionItem'
import { theme } from '@/theme/theme'
import {
  collectAllNodes,
  findByAccessibilityLabel,
  findByType
} from '@/__tests__/helpers/mockNodeTraversal'

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    useCallback: (fn: unknown) => fn
  }
})

vi.mock('react-native', () => ({
  LayoutAnimation: {
    configureNext: vi.fn(),
    Presets: { easeInEaseOut: {} }
  },
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint,
    style
  }: Record<string, unknown>) => ({
    type: 'Pressable',
    props: {
      children,
      onPress,
      accessibilityLabel,
      accessibilityRole,
      accessibilityHint,
      style
    }
  }),
  TouchableOpacity: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint,
    hitSlop,
    activeOpacity,
    style
  }: Record<string, unknown>) => ({
    type: 'TouchableOpacity',
    props: {
      children,
      onPress,
      accessibilityLabel,
      accessibilityRole,
      accessibilityHint,
      hitSlop,
      activeOpacity,
      style
    }
  }),
  Text: ({ children, style }: Record<string, unknown>) => ({
    type: 'Text',
    props: { children, style }
  }),
  View: (props: Record<string, unknown>) => ({
    type: 'View',
    props
  }),
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles
  }
}))

vi.mock('react-native-reanimated', () => ({
  default: {
    View: ({ children, style }: { children?: unknown; style?: unknown }) => ({
      type: 'Animated.View',
      props: { children, style }
    })
  },
  useSharedValue: (v: number) => ({ value: v }),
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  useAnimatedStyle: (fn: () => unknown) => fn(),
  withTiming: (v: number) => v
}))

function makeExercise(overrides?: Partial<ExerciseState>): ExerciseState {
  return {
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    sets: [
      { reps: 8, weight: 135, status: 'active' },
      { reps: 8, weight: 135, status: 'pending' },
      { reps: 8, weight: 135, status: 'pending' },
      { reps: 8, weight: 135, status: 'pending' }
    ],
    ...overrides
  }
}

function makeCompletedExercise(): ExerciseState {
  return {
    exerciseId: 'squat',
    exerciseName: 'Squat',
    sets: [
      {
        reps: 5,
        weight: 225,
        status: 'completed',
        confirmedReps: 5,
        confirmedWeight: 225
      },
      {
        reps: 5,
        weight: 225,
        status: 'completed',
        confirmedReps: 5,
        confirmedWeight: 225
      },
      {
        reps: 5,
        weight: 225,
        status: 'completed',
        confirmedReps: 5,
        confirmedWeight: 225
      }
    ]
  }
}

function renderAccordion(
  overrides?: Partial<Parameters<typeof ExerciseAccordionItem>[0]>
) {
  return ExerciseAccordionItem({
    exercise: makeExercise(),
    exerciseIndex: 0,
    isExpanded: false,
    onToggle: vi.fn(),
    onSetDotPress: vi.fn(),
    ...overrides
  })
}

describe('ExerciseAccordionItem', () => {
  describe('compact view rendering', () => {
    it('renders exercise name', () => {
      const result = renderAccordion()
      const textNodes = findByType(result, 'Text')
      const nameNode = textNodes.find(t => t.props.children === 'Bench Press')
      expect(nameNode).toBeDefined()
    })

    it('renders set meta with completed/total count', () => {
      const result = renderAccordion()
      const textNodes = findByType(result, 'Text')
      const metaNode = textNodes.find(
        t =>
          typeof t.props.children === 'string' &&
          t.props.children.startsWith('0/4')
      )
      expect(metaNode).toBeDefined()
    })

    it('renders correct number of SetDot pressables', () => {
      const result = renderAccordion()
      const touchables = findByType(result, 'TouchableOpacity')
      const dotTouchables = touchables.filter(
        p =>
          typeof p.props.accessibilityHint === 'string' &&
          (p.props.accessibilityHint as string).includes('navigate to this set')
      )
      expect(dotTouchables.length).toBe(4)
    })

    it('renders set meta with weight when sets have confirmed weight', () => {
      const exercise = makeExercise({
        sets: [
          {
            reps: 8,
            weight: 135,
            status: 'completed',
            confirmedReps: 8,
            confirmedWeight: 135
          },
          { reps: 8, weight: 135, status: 'pending' }
        ]
      })
      const result = renderAccordion({ exercise })
      const textNodes = findByType(result, 'Text')
      const metaNode = textNodes.find(
        t =>
          typeof t.props.children === 'string' &&
          (t.props.children as string).includes('135 lbs')
      )
      expect(metaNode).toBeDefined()
    })
  })

  describe('completed exercise', () => {
    it('renders exercise name with success color', () => {
      const exercise = makeCompletedExercise()
      const result = renderAccordion({ exercise })
      const textNodes = findByType(result, 'Text')
      const nameNode = textNodes.find(t => t.props.children === 'Squat')
      expect(nameNode).toBeDefined()
      const style = nameNode!.props.style as unknown[]
      const hasSuccessColor = style.some(
        (s: unknown) =>
          s &&
          typeof s === 'object' &&
          (s as { color: string }).color === theme.colors.success
      )
      expect(hasSuccessColor).toBe(true)
    })

    it('renders all SetDots as completed', () => {
      const exercise = makeCompletedExercise()
      const result = renderAccordion({ exercise })
      const touchables = findByType(result, 'TouchableOpacity')
      const dotTouchables = touchables.filter(
        p =>
          typeof p.props.accessibilityHint === 'string' &&
          (p.props.accessibilityHint as string).includes(
            'navigate to this set'
          ) &&
          typeof p.props.accessibilityLabel === 'string' &&
          (p.props.accessibilityLabel as string).includes('completed')
      )
      expect(dotTouchables.length).toBe(3)
    })
  })

  describe('accessibility labels', () => {
    it('has correct compact accessibility label', () => {
      const result = renderAccordion()
      const node = findByAccessibilityLabel(
        result,
        'Bench Press, 0 of 4 sets complete, tap to expand'
      )
      expect(node).toBeDefined()
    })

    it('has correct expanded accessibility label', () => {
      const result = renderAccordion({ isExpanded: true })
      const node = findByAccessibilityLabel(
        result,
        'Bench Press, expanded, tap to collapse'
      )
      expect(node).toBeDefined()
    })
  })

  describe('interactions', () => {
    it('fires onToggle when compact row is pressed', () => {
      const onToggle = vi.fn()
      const result = renderAccordion({ onToggle })
      const pressable = findByAccessibilityLabel(
        result,
        'Bench Press, 0 of 4 sets complete, tap to expand'
      )
      expect(pressable).toBeDefined()
      const onPress = pressable!.props.onPress as () => void
      onPress()
      expect(onToggle).toHaveBeenCalledOnce()
    })

    it('fires onSetDotPress when a SetDot is tapped', () => {
      const onSetDotPress = vi.fn()
      const result = renderAccordion({ onSetDotPress })
      const dotTouchables = findByType(result, 'TouchableOpacity').filter(
        p =>
          typeof p.props.accessibilityLabel === 'string' &&
          (p.props.accessibilityLabel as string).startsWith('Set ')
      )
      expect(dotTouchables.length).toBeGreaterThan(0)
      const firstDot = dotTouchables[0]
      const onPress = firstDot.props.onPress as () => void
      onPress()
      expect(onSetDotPress).toHaveBeenCalledWith(0)
    })
  })

  describe('compact-active state', () => {
    it('applies primaryLight background when exercise has active set and not expanded', () => {
      const exercise = makeExercise()
      const result = renderAccordion({
        exercise,
        isExpanded: false
      })
      const allNodes = collectAllNodes(result)
      const rootView = allNodes[0]
      expect(rootView).toBeDefined()
      const style = rootView.props.style as unknown[]
      const hasPrimaryLight = style.some(
        (s: unknown) =>
          s &&
          typeof s === 'object' &&
          (s as { backgroundColor: string }).backgroundColor ===
            theme.colors.primaryLight
      )
      expect(hasPrimaryLight).toBe(true)
    })
  })

  describe('progress bar', () => {
    it('renders progress bar with correct accessibility attributes at 0%', () => {
      const result = renderAccordion({ isExpanded: true })
      const allNodes = collectAllNodes(result)
      const progressBar = allNodes.find(
        n => n.props?.accessibilityRole === 'progressbar'
      )
      expect(progressBar).toBeDefined()
      expect(progressBar!.props.accessibilityLabel).toBe(
        'Set completion progress'
      )
      const value = progressBar!.props.accessibilityValue as {
        min: number
        max: number
        now: number
      }
      expect(value).toEqual({ min: 0, max: 100, now: 0 })
    })

    it('renders progress bar at 100% for completed exercise', () => {
      const exercise = makeCompletedExercise()
      const result = renderAccordion({ exercise, isExpanded: true })
      const allNodes = collectAllNodes(result)
      const progressBar = allNodes.find(
        n => n.props?.accessibilityRole === 'progressbar'
      )
      expect(progressBar).toBeDefined()
      const value = progressBar!.props.accessibilityValue as {
        min: number
        max: number
        now: number
      }
      expect(value).toEqual({ min: 0, max: 100, now: 100 })
    })

    it('renders progress bar at 50% for partially completed exercise', () => {
      const exercise = makeExercise({
        sets: [
          { reps: 8, weight: 135, status: 'completed' },
          { reps: 8, weight: 135, status: 'skipped' },
          { reps: 8, weight: 135, status: 'active' },
          { reps: 8, weight: 135, status: 'pending' }
        ]
      })
      const result = renderAccordion({ exercise, isExpanded: true })
      const allNodes = collectAllNodes(result)
      const progressBar = allNodes.find(
        n => n.props?.accessibilityRole === 'progressbar'
      )
      expect(progressBar).toBeDefined()
      const value = progressBar!.props.accessibilityValue as {
        min: number
        max: number
        now: number
      }
      expect(value).toEqual({ min: 0, max: 100, now: 50 })
    })
  })
})
