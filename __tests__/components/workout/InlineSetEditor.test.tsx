import { describe, expect, it, vi } from 'vitest'

import { InlineSetEditor } from '@/components/workout/InlineSetEditor'
import type { SetStatus } from '@/types/workout'
import {
  findByAccessibilityLabel,
  findByType
} from '@/__tests__/helpers/mockNodeTraversal'

vi.mock('react-native', () => ({
  Modal: ({ children, visible }: Record<string, unknown>) => ({
    type: 'Modal',
    props: { children, visible }
  }),
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    accessibilityState,
    style
  }: Record<string, unknown>) => ({
    type: 'Pressable',
    props: {
      children,
      onPress,
      accessibilityLabel,
      accessibilityRole,
      accessibilityState,
      style
    }
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

function render(overrides?: Partial<Parameters<typeof InlineSetEditor>[0]>) {
  return InlineSetEditor({
    visible: true,
    field: 'weight',
    setNumber: 1,
    status: 'active' as SetStatus,
    value: 100,
    prefillBase: 100,
    onChange: vi.fn(),
    onDone: vi.fn(),
    onSecondary: vi.fn(),
    ...overrides
  })
}

describe('InlineSetEditor', () => {
  it('renders the field title', () => {
    const result = render({ field: 'weight', setNumber: 2 })
    const texts = findByType(result, 'Text')
    const title = texts.find(
      t =>
        Array.isArray(t.props.children) &&
        t.props.children.join('') === 'SET 2 · WEIGHT'
    )
    expect(title).toBeDefined()
  })

  it('increments by 5 for weight', () => {
    const onChange = vi.fn()
    const result = render({ field: 'weight', value: 100, onChange })
    const inc = findByAccessibilityLabel(result, 'Increase weight')
    ;(inc!.props.onPress as () => void)()
    expect(onChange).toHaveBeenCalledWith(105)
  })

  it('decrements by 1 for reps and floors at 1', () => {
    const onChange = vi.fn()
    const result = render({ field: 'reps', value: 1, onChange })
    const dec = findByAccessibilityLabel(result, 'Decrease reps')
    ;(dec!.props.onPress as () => void)()
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('renders quick chips around the prefill and fires onChange', () => {
    const onChange = vi.fn()
    const result = render({ field: 'weight', prefillBase: 100, onChange })
    const chip = findByAccessibilityLabel(result, 'Set weight to 110')
    expect(chip).toBeDefined()
    ;(chip!.props.onPress as () => void)()
    expect(onChange).toHaveBeenCalledWith(110)
  })

  it('marks the chip matching the current value as selected', () => {
    const result = render({ field: 'weight', value: 105, prefillBase: 100 })
    const chip = findByAccessibilityLabel(result, 'Set weight to 105')
    expect(
      (chip!.props.accessibilityState as { selected: boolean }).selected
    ).toBe(true)
  })

  it('shows "Skip set" for an active set', () => {
    const result = render({ status: 'active' })
    expect(findByAccessibilityLabel(result, 'Skip set')).toBeDefined()
  })

  it('shows "Unlog set" for an editing set', () => {
    const result = render({ status: 'editing' })
    expect(findByAccessibilityLabel(result, 'Unlog set')).toBeDefined()
  })

  it('shows "Restore set" for a skipped set', () => {
    const result = render({ status: 'skipped' })
    expect(findByAccessibilityLabel(result, 'Restore set')).toBeDefined()
  })

  it('fires onSecondary and onDone', () => {
    const onSecondary = vi.fn()
    const onDone = vi.fn()
    const result = render({ status: 'editing', onSecondary, onDone })
    ;(
      findByAccessibilityLabel(result, 'Unlog set')!.props.onPress as () => void
    )()
    ;(findByAccessibilityLabel(result, 'Done')!.props.onPress as () => void)()
    expect(onSecondary).toHaveBeenCalledOnce()
    expect(onDone).toHaveBeenCalledOnce()
  })
})
