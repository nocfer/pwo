import { describe, expect, it, vi } from 'vitest'
import type { ExerciseState } from '@/types/workout'

import { ExerciseAccordionItem } from '@/components/workout/ExerciseAccordionItem'
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
    disabled,
    accessibilityLabel,
    accessibilityRole,
    style
  }: Record<string, unknown>) => ({
    type: 'Pressable',
    props: { children, onPress, disabled, accessibilityLabel, accessibilityRole, style }
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
  },
  Platform: { OS: 'ios' }
}))

function makeActiveExercise(overrides?: Partial<ExerciseState>): ExerciseState {
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

function makePendingExercise(): ExerciseState {
  return {
    exerciseId: 'row',
    exerciseName: 'Barbell Row',
    sets: [
      { reps: 10, weight: 95, status: 'pending' },
      { reps: 10, weight: 95, status: 'pending' }
    ]
  }
}

function makeCompletedExercise(): ExerciseState {
  return {
    exerciseId: 'squat',
    exerciseName: 'Squat',
    sets: [
      { reps: 5, weight: 225, status: 'completed', confirmedReps: 5, confirmedWeight: 225 },
      { reps: 5, weight: 245, status: 'completed', confirmedReps: 5, confirmedWeight: 245 },
      { reps: 5, weight: 225, status: 'completed', confirmedReps: 5, confirmedWeight: 225 }
    ]
  }
}

function render(
  overrides?: Partial<Parameters<typeof ExerciseAccordionItem>[0]>
) {
  return ExerciseAccordionItem({
    exercise: makeActiveExercise(),
    exerciseIndex: 0,
    isExpanded: false,
    onToggle: vi.fn(),
    ...overrides
  })
}

describe('ExerciseAccordionItem', () => {
  describe('expanded card', () => {
    it('renders an informational expanded header (no collapse toggle)', () => {
      const result = render({ isExpanded: true })
      const header = findByAccessibilityLabel(result, 'Bench Press, expanded')
      expect(header).toBeDefined()
      expect(header!.props.accessibilityRole).toBe('header')
      expect(header!.props.onPress).toBeUndefined()
    })

    it('shows the NOW badge for the active exercise', () => {
      const result = render({ isExpanded: true })
      const texts = findByType(result, 'Text')
      expect(texts.some(t => t.props.children === 'NOW')).toBe(true)
    })

    it('shows the UP NEXT badge for a pending exercise', () => {
      const result = render({ exercise: makePendingExercise(), isExpanded: true })
      const texts = findByType(result, 'Text')
      expect(texts.some(t => t.props.children === 'UP NEXT')).toBe(true)
    })

    it('shows the DONE badge for a completed exercise', () => {
      const result = render({ exercise: makeCompletedExercise(), isExpanded: true })
      const texts = findByType(result, 'Text')
      expect(texts.some(t => t.props.children === 'DONE')).toBe(true)
    })

    it('renders the prefill sub-line from the first set', () => {
      const result = render({ isExpanded: true })
      const texts = findByType(result, 'Text')
      const sub = texts.find(
        t => Array.isArray(t.props.children) && t.props.children.join('') === 'Last · 135 × 8'
      )
      expect(sub).toBeDefined()
    })

    it('renders the Add set control for the active exercise and fires onAddSet', () => {
      const onAddSet = vi.fn()
      const result = render({ isExpanded: true, onAddSet })
      const addSet = findByAccessibilityLabel(result, 'Add set')
      expect(addSet).toBeDefined()
      ;(addSet!.props.onPress as () => void)()
      expect(onAddSet).toHaveBeenCalledOnce()
    })

    it('does not render Add set for a pending exercise', () => {
      const result = render({ exercise: makePendingExercise(), isExpanded: true })
      expect(findByAccessibilityLabel(result, 'Add set')).toBeUndefined()
    })
  })

  describe('collapsed — done', () => {
    it('renders the done summary and expands on press', () => {
      const onToggle = vi.fn()
      const result = render({ exercise: makeCompletedExercise(), onToggle })
      const row = findByAccessibilityLabel(
        result,
        'Squat, done, 3 of 3 sets, tap to expand'
      )
      expect(row).toBeDefined()
      ;(row!.props.onPress as () => void)()
      expect(onToggle).toHaveBeenCalledOnce()
      const texts = findByType(result, 'Text')
      expect(
        texts.some(
          t => Array.isArray(t.props.children) && t.props.children.join('') === '3/3 · top 245 lb'
        )
      ).toBe(true)
    })
  })

  describe('collapsed — current', () => {
    it('renders the current-exercise summary', () => {
      const result = render({ exercise: makeActiveExercise(), isExpanded: false })
      const row = findByAccessibilityLabel(
        result,
        'Bench Press, current exercise, set 1 of 4, tap to expand'
      )
      expect(row).toBeDefined()
      const texts = findByType(result, 'Text')
      expect(
        texts.some(
          t => Array.isArray(t.props.children) && t.props.children.join('') === 'Set 1 of 4'
        )
      ).toBe(true)
    })
  })

  describe('collapsed — pending with reorder', () => {
    it('renders reorder chevrons and fires move callbacks', () => {
      const onMoveUp = vi.fn()
      const onMoveDown = vi.fn()
      const result = render({
        exercise: makePendingExercise(),
        onMoveUp,
        onMoveDown,
        canMoveUp: true,
        canMoveDown: true
      })
      const up = findByAccessibilityLabel(result, 'Move Barbell Row up')
      const down = findByAccessibilityLabel(result, 'Move Barbell Row down')
      expect(up).toBeDefined()
      expect(down).toBeDefined()
      ;(up!.props.onPress as () => void)()
      ;(down!.props.onPress as () => void)()
      expect(onMoveUp).toHaveBeenCalledOnce()
      expect(onMoveDown).toHaveBeenCalledOnce()
    })

    it('disables the up chevron when canMoveUp is false', () => {
      const result = render({
        exercise: makePendingExercise(),
        canMoveUp: false
      })
      const up = findByAccessibilityLabel(result, 'Move Barbell Row up')
      expect(up!.props.disabled).toBe(true)
    })

    it('expands on tapping the name area', () => {
      const onToggle = vi.fn()
      const result = render({ exercise: makePendingExercise(), onToggle })
      const name = findByAccessibilityLabel(
        result,
        'Barbell Row, upcoming, 2 sets, tap to expand'
      )
      expect(name).toBeDefined()
      ;(name!.props.onPress as () => void)()
      expect(onToggle).toHaveBeenCalledOnce()
    })
  })

  describe('overall structure', () => {
    it('expanded card includes a progress fill', () => {
      const result = render({ isExpanded: true })
      const views = collectAllNodes(result)
      // the progress bar fill carries an explicit backgroundColor + width
      const fill = views.find(n => {
        const s = n.props?.style as unknown[] | undefined
        return (
          Array.isArray(s) &&
          s.some(x => x && typeof x === 'object' && 'width' in x)
        )
      })
      expect(fill).toBeDefined()
    })
  })
})
