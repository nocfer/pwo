import { describe, expect, it, vi } from 'vitest'

import { WorkoutRecap } from '@/components/workout/WorkoutRecap'
import type { WorkoutRecap as WorkoutRecapModel } from '@/lib/workoutRecap'
import {
  findByAccessibilityLabel,
  findByType
} from '@/__tests__/helpers/mockNodeTraversal'

vi.mock('@/components/ConfettiCelebration', () => ({
  ConfettiCelebration: () => null
}))

vi.mock('@/components/common/MaxWidthContainer', () => ({
  MaxWidthContainer: ({ children }: Record<string, unknown>) => ({
    type: 'MaxWidthContainer',
    props: { children }
  })
}))

vi.mock('react-native', () => ({
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    style
  }: Record<string, unknown>) => ({
    type: 'Pressable',
    props: { children, onPress, accessibilityLabel, accessibilityRole, style }
  }),
  ScrollView: ({ children, style }: Record<string, unknown>) => ({
    type: 'ScrollView',
    props: { children, style }
  }),
  Text: ({ children, style }: Record<string, unknown>) => ({
    type: 'Text',
    props: { children, style }
  }),
  View: ({ children, style }: Record<string, unknown>) => ({
    type: 'View',
    props: { children, style }
  }),
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles
  }
}))

function model(overrides?: Partial<WorkoutRecapModel>): WorkoutRecapModel {
  return {
    timeStr: '12:34',
    setsCount: 9,
    volume: 12500,
    totalSkipped: 0,
    rows: [
      { exerciseId: 'a', name: 'Bench', detail: '3 sets · top 145 lb', isPR: true },
      { exerciseId: 'b', name: 'Squat', detail: '3 sets · top 225 lb', isPR: false }
    ],
    ...overrides
  }
}

function render(overrides?: Partial<Parameters<typeof WorkoutRecap>[0]>) {
  return WorkoutRecap({
    programName: 'Push Day',
    recap: model(),
    onShare: vi.fn(),
    onDone: vi.fn(),
    ...overrides
  })
}

describe('WorkoutRecap', () => {
  it('renders the eyebrow and title', () => {
    const result = render()
    const texts = findByType(result, 'Text')
    expect(texts.some(t => t.props.children === 'SESSION COMPLETE')).toBe(true)
    const title = texts.find(
      t =>
        Array.isArray(t.props.children) &&
        t.props.children.join('') === 'Push Day · recap'
    )
    expect(title).toBeDefined()
  })

  it('renders stat values including formatted volume', () => {
    const result = render()
    const texts = findByType(result, 'Text')
    expect(texts.some(t => t.props.children === '12:34')).toBe(true)
    expect(texts.some(t => t.props.children === '9')).toBe(true)
    expect(texts.some(t => t.props.children === '12,500')).toBe(true)
  })

  it('shows the skipped pill only when there are skipped sets', () => {
    const withSkips = render({ recap: model({ totalSkipped: 2 }) })
    const texts = findByType(withSkips, 'Text')
    expect(
      texts.some(
        t =>
          Array.isArray(t.props.children) &&
          t.props.children.join('') === '2 sets skipped'
      )
    ).toBe(true)

    const noSkips = render({ recap: model({ totalSkipped: 0 }) })
    const texts2 = findByType(noSkips, 'Text')
    expect(
      texts2.some(
        t =>
          Array.isArray(t.props.children) &&
          t.props.children.join('').includes('skipped')
      )
    ).toBe(false)
  })

  it('renders a PR badge for PR rows and a dash otherwise', () => {
    const result = render()
    const texts = findByType(result, 'Text')
    expect(texts.some(t => t.props.children === 'PR')).toBe(true)
    expect(texts.some(t => t.props.children === '—')).toBe(true)
  })

  it('fires onShare and onDone', () => {
    const onShare = vi.fn()
    const onDone = vi.fn()
    const result = render({ onShare, onDone })
    ;(
      findByAccessibilityLabel(result, 'Share workout')!.props
        .onPress as () => void
    )()
    ;(findByAccessibilityLabel(result, 'Done')!.props.onPress as () => void)()
    expect(onShare).toHaveBeenCalledOnce()
    expect(onDone).toHaveBeenCalledOnce()
  })
})
