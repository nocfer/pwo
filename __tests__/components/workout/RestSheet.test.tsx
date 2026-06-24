import { describe, expect, it, vi } from 'vitest'

import { RestSheet } from '@/components/workout/RestSheet'
import {
  findByAccessibilityLabel,
  findByType
} from '@/__tests__/helpers/mockNodeTraversal'

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
  Text: ({ children, style }: Record<string, unknown>) => ({
    type: 'Text',
    props: { children, style }
  }),
  View: ({ children, style, accessibilityLabel }: Record<string, unknown>) => ({
    type: 'View',
    props: { children, style, accessibilityLabel }
  }),
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles
  }
}))

vi.mock('react-native-svg', () => ({
  default: ({ children }: Record<string, unknown>) => ({
    type: 'Svg',
    props: { children }
  }),
  Circle: (props: Record<string, unknown>) => ({ type: 'Circle', props })
}))

function render(overrides?: Partial<Parameters<typeof RestSheet>[0]>) {
  return RestSheet({
    remainingMs: 90000,
    durationMs: 120000,
    nextSetNumber: 2,
    nextExerciseName: 'Squat',
    nextWeight: 225,
    nextReps: 5,
    onExtend: vi.fn(),
    onSkip: vi.fn(),
    ...overrides
  })
}

describe('RestSheet', () => {
  it('renders the countdown as m:ss', () => {
    const result = render({ remainingMs: 90000 })
    const texts = findByType(result, 'Text')
    expect(texts.some(t => t.props.children === '1:30')).toBe(true)
  })

  it('renders the next-set preview', () => {
    const result = render()
    const texts = findByType(result, 'Text')
    const preview = texts.find(
      t =>
        Array.isArray(t.props.children) &&
        t.props.children.join('') === 'Next · Set 2 · Squat'
    )
    expect(preview).toBeDefined()
  })

  it('fires onExtend from +15s', () => {
    const onExtend = vi.fn()
    const result = render({ onExtend })
    const btn = findByAccessibilityLabel(result, 'Add 15 seconds to rest')
    ;(btn!.props.onPress as () => void)()
    expect(onExtend).toHaveBeenCalledOnce()
  })

  it('fires onSkip from Skip rest', () => {
    const onSkip = vi.fn()
    const result = render({ onSkip })
    const btn = findByAccessibilityLabel(result, 'Skip rest')
    ;(btn!.props.onPress as () => void)()
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('reflects progress in the ring stroke offset (half at 50%)', () => {
    const result = render({ remainingMs: 60000, durationMs: 120000 })
    const circles = findByType(result, 'Circle')
    // second circle is the progress arc
    const arc = circles[circles.length - 1]
    const dash = arc.props.strokeDasharray as number
    const offset = arc.props.strokeDashoffset as number
    expect(offset).toBeCloseTo(dash * 0.5, 5)
  })

  it('clamps progress when remaining exceeds duration (after +15s)', () => {
    const result = render({ remainingMs: 130000, durationMs: 120000 })
    const circles = findByType(result, 'Circle')
    const arc = circles[circles.length - 1]
    // progress clamped to 1 -> offset 0
    expect(arc.props.strokeDashoffset).toBe(0)
  })
})
