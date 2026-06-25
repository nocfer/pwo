import { describe, expect, it, vi } from 'vitest'
import React from 'react'

import { SetRow } from '@/components/workout/SetRow'
import type { SetStatus } from '@/types/workout'
import {
  collectAllNodes,
  findByAccessibilityLabel,
  findByType
} from '@/__tests__/helpers/mockNodeTraversal'

vi.mock('react-native', () => ({
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityRole,
    hitSlop,
    style
  }: Record<string, unknown>) => ({
    type: 'Pressable',
    props: { children, onPress, accessibilityLabel, accessibilityRole, hitSlop, style }
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
  },
  Platform: { OS: 'ios' }
}))

function renderSetRow(overrides?: Partial<Parameters<typeof SetRow>[0]>) {
  return SetRow({
    setNumber: 1,
    reps: 8,
    weight: 135,
    status: 'active' as SetStatus,
    onRepsPress: vi.fn(),
    onWeightPress: vi.fn(),
    onConfirm: vi.fn(),
    onPress: vi.fn(),
    ...overrides
  })
}

describe('SetRow', () => {
  describe('status accessibility label', () => {
    it('labels a pending set', () => {
      const result = renderSetRow({ status: 'pending', setNumber: 2 })
      expect(result.props.accessibilityLabel).toBe(
        'Set 2, pending, 135 pounds for 8 reps'
      )
    })

    it('labels an active set as ready to log', () => {
      const result = renderSetRow({ status: 'active', setNumber: 3 })
      expect(result.props.accessibilityLabel).toBe(
        'Set 3, ready to log, 135 pounds for 8 reps'
      )
    })

    it('labels a completed set', () => {
      const result = renderSetRow({
        status: 'completed',
        setNumber: 1,
        reps: 10,
        weight: 200
      })
      expect(result.props.accessibilityLabel).toBe(
        'Set 1, completed, 200 pounds for 10 reps'
      )
    })

    it('labels a skipped set', () => {
      const result = renderSetRow({ status: 'skipped', setNumber: 2 })
      expect(result.props.accessibilityLabel).toBe(
        'Set 2, skipped, 135 pounds for 8 reps'
      )
    })
  })

  describe('value cells', () => {
    it('exposes the weight cell and fires onWeightPress', () => {
      const onWeightPress = vi.fn()
      const result = renderSetRow({ weight: 225, onWeightPress })
      const cell = findByAccessibilityLabel(result, 'Weight 225 pounds')
      expect(cell).toBeDefined()
      ;(cell!.props.onPress as () => void)()
      expect(onWeightPress).toHaveBeenCalledOnce()
    })

    it('exposes the reps cell and fires onRepsPress', () => {
      const onRepsPress = vi.fn()
      const result = renderSetRow({ reps: 12, onRepsPress })
      const cell = findByAccessibilityLabel(result, 'Reps 12')
      expect(cell).toBeDefined()
      ;(cell!.props.onPress as () => void)()
      expect(onRepsPress).toHaveBeenCalledOnce()
    })
  })

  describe('trailing check', () => {
    it('logs the active set when pressed', () => {
      const onConfirm = vi.fn()
      const result = renderSetRow({ status: 'active', onConfirm })
      const check = findByAccessibilityLabel(result, 'Log set 1')
      expect(check).toBeDefined()
      ;(check!.props.onPress as () => void)()
      expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('edits a completed set when pressed', () => {
      const onPress = vi.fn()
      const result = renderSetRow({ status: 'completed', onPress })
      const check = findByAccessibilityLabel(result, 'Edit set 1')
      expect(check).toBeDefined()
      ;(check!.props.onPress as () => void)()
      expect(onPress).toHaveBeenCalledOnce()
    })

    it('navigates a pending set when pressed', () => {
      const onPress = vi.fn()
      const result = renderSetRow({ status: 'pending', onPress })
      const check = findByAccessibilityLabel(result, 'Set 1')
      expect(check).toBeDefined()
      ;(check!.props.onPress as () => void)()
      expect(onPress).toHaveBeenCalledOnce()
    })

    it('renders a checkmark icon in the active state', () => {
      const result = renderSetRow({ status: 'active' })
      const icons = findByType(result, 'Icon')
      expect(icons.some(i => i.props.name === 'checkmark')).toBe(true)
    })

    it('renders a dash icon in the skipped state', () => {
      const result = renderSetRow({ status: 'skipped' })
      const icons = findByType(result, 'Icon')
      expect(icons.some(i => i.props.name === 'remove')).toBe(true)
    })
  })

  describe('focus state', () => {
    it('applies a focus background to the focused weight cell', () => {
      const result = renderSetRow({ isWeightFocused: true })
      const cell = collectAllNodes(result).find(
        n => n.props?.accessibilityLabel === 'Weight 135 pounds'
      )
      expect(cell).toBeDefined()
      const style = cell!.props.style as unknown[]
      const focused = style.some(
        s => s && typeof s === 'object' && 'backgroundColor' in s
      )
      expect(focused).toBe(true)
    })
  })

  describe('timed (hold) rows', () => {
    it('labels a completed hold in m:ss instead of reps×weight', () => {
      const result = renderSetRow({
        status: 'completed',
        durationSeconds: 45,
        setNumber: 1
      })
      expect(result.props.accessibilityLabel).toBe(
        'Set 1, completed, hold 0:45'
      )
    })

    it('renders a single HOLD cell with the m:ss value (no weight/reps cells)', () => {
      const result = renderSetRow({ status: 'completed', durationSeconds: 90 })
      const holdCell = findByAccessibilityLabel(result, 'Hold 1:30')
      expect(holdCell).toBeDefined()
      // the reps/weight cells must not be present on a timed row
      expect(
        findByAccessibilityLabel(result, 'Weight 135 pounds')
      ).toBeUndefined()
    })

    it('uses a play ▶ trailing control for the active hold (start), not a check', () => {
      const result = renderSetRow({ status: 'active', durationSeconds: 45 })
      const start = findByAccessibilityLabel(result, 'Start hold for set 1')
      expect(start).toBeDefined()
      const icons = findByType(result, 'Icon')
      expect(icons.some(i => i.props.name === 'play')).toBe(true)
    })

    it('routes a HOLD value tap to onHoldPress', () => {
      const onHoldPress = vi.fn()
      const result = renderSetRow({
        status: 'completed',
        durationSeconds: 30,
        onHoldPress
      })
      const holdCell = findByAccessibilityLabel(result, 'Hold 0:30')
      ;(holdCell!.props.onPress as () => void)()
      expect(onHoldPress).toHaveBeenCalled()
    })
  })
})
