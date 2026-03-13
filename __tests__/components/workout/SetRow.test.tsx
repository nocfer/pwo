import { describe, expect, it, vi } from 'vitest'
import React from 'react'

vi.mock('react-native', () => ({
  Pressable: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityHint,
    accessibilityRole,
    style
  }: Record<string, unknown>) => ({
    type: 'Pressable',
    props: {
      children,
      onPress,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
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

import { SetRow } from '@/components/workout/SetRow'
import type { SetStatus } from '@/types/workout'
import {
  collectAllNodes,
  findByAccessibilityLabel,
  findByType
} from '@/__tests__/helpers/mockNodeTraversal'

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
  describe('state rendering', () => {
    it('renders pending state with correct accessibility label', () => {
      const result = renderSetRow({ status: 'pending', setNumber: 2 })
      expect(result.props.accessibilityLabel).toBe('Set 2, pending')
    })

    it('renders active state with "ready to confirm" label', () => {
      const result = renderSetRow({ status: 'active', setNumber: 3 })
      expect(result.props.accessibilityLabel).toBe('Set 3, ready to confirm')
    })

    it('renders completed state with reps and weight in label', () => {
      const result = renderSetRow({
        status: 'completed',
        setNumber: 1,
        reps: 10,
        weight: 200
      })
      expect(result.props.accessibilityLabel).toBe(
        'Set 1, completed, 10 reps at 200 lbs'
      )
    })

    it('renders editing state with correct label', () => {
      const result = renderSetRow({ status: 'editing', setNumber: 4 })
      expect(result.props.accessibilityLabel).toBe('Set 4, editing')
    })

    it('renders skipped state with correct label', () => {
      const result = renderSetRow({ status: 'skipped', setNumber: 2 })
      expect(result.props.accessibilityLabel).toBe('Set 2, skipped')
    })

    it('shows dash icon in skipped state instead of set number', () => {
      const result = renderSetRow({ status: 'skipped', setNumber: 2 })
      const textNodes = findByType(result, 'Text')
      const dashNode = textNodes.find(t => t.props.children === '–')
      expect(dashNode).toBeDefined()
    })

    it('shows pencil icon in editing state instead of set number', () => {
      const result = renderSetRow({ status: 'editing', setNumber: 2 })
      const textNodes = findByType(result, 'Text')
      const pencilNode = textNodes.find(t => t.props.children === '✎')
      expect(pencilNode).toBeDefined()
    })

    it('shows set number for non-editing states', () => {
      const result = renderSetRow({ status: 'active', setNumber: 3 })
      const textNodes = findByType(result, 'Text')
      const numNode = textNodes.find(t => t.props.children === 3)
      expect(numNode).toBeDefined()
    })
  })

  describe('confirm button accessibility', () => {
    it('has "Confirm set N" label for active state', () => {
      const result = renderSetRow({ status: 'active', setNumber: 2 })
      const confirm = findByAccessibilityLabel(result, 'Confirm set 2')
      expect(confirm).toBeDefined()
    })

    it('has "Re-confirm set N" label for editing state', () => {
      const result = renderSetRow({ status: 'editing', setNumber: 3 })
      const confirm = findByAccessibilityLabel(result, 'Re-confirm set 3')
      expect(confirm).toBeDefined()
    })

    it('has "Confirm set N" label for pending state', () => {
      const result = renderSetRow({ status: 'pending', setNumber: 1 })
      const confirm = findByAccessibilityLabel(result, 'Confirm set 1')
      expect(confirm).toBeDefined()
    })
  })

  describe('value display', () => {
    it('displays reps value', () => {
      const result = renderSetRow({ reps: 12 })
      const repsField = findByAccessibilityLabel(result, 'reps, 12')
      expect(repsField).toBeDefined()
    })

    it('displays weight value', () => {
      const result = renderSetRow({ weight: 225 })
      const weightField = findByAccessibilityLabel(result, 'weight, 225')
      expect(weightField).toBeDefined()
    })

    it('displays "reps" label text', () => {
      const result = renderSetRow()
      const textNodes = findByType(result, 'Text')
      const repsLabel = textNodes.find(t => t.props.children === 'reps')
      expect(repsLabel).toBeDefined()
    })

    it('displays "lbs" label text', () => {
      const result = renderSetRow()
      const textNodes = findByType(result, 'Text')
      const lbsLabel = textNodes.find(t => t.props.children === 'lbs')
      expect(lbsLabel).toBeDefined()
    })
  })

  describe('checkmark rendering', () => {
    it('renders checkmark in confirm button', () => {
      const result = renderSetRow({ status: 'active' })
      const confirm = findByAccessibilityLabel(result, 'Confirm set 1')
      expect(confirm).toBeDefined()
      const textNodes = findByType(confirm!, 'Text')
      const checkmark = textNodes.find(t => t.props.children === '✓')
      expect(checkmark).toBeDefined()
    })
  })

  describe('callbacks', () => {
    it('fires onRepsPress when reps field is pressed', () => {
      const onRepsPress = vi.fn()
      const result = renderSetRow({ onRepsPress })
      const repsField = findByAccessibilityLabel(result, 'reps, 8')
      expect(repsField).toBeDefined()
      const onPress = repsField!.props.onPress as () => void
      onPress()
      expect(onRepsPress).toHaveBeenCalledOnce()
    })

    it('fires onWeightPress when weight field is pressed', () => {
      const onWeightPress = vi.fn()
      const result = renderSetRow({ onWeightPress })
      const weightField = findByAccessibilityLabel(result, 'weight, 135')
      expect(weightField).toBeDefined()
      const onPress = weightField!.props.onPress as () => void
      onPress()
      expect(onWeightPress).toHaveBeenCalledOnce()
    })

    it('fires onConfirm when confirm button is pressed', () => {
      const onConfirm = vi.fn()
      const result = renderSetRow({ onConfirm })
      const confirm = findByAccessibilityLabel(result, 'Confirm set 1')
      expect(confirm).toBeDefined()
      const onPress = confirm!.props.onPress as () => void
      onPress()
      expect(onConfirm).toHaveBeenCalledOnce()
    })

    it('fires onPress when row is pressed', () => {
      const onPress = vi.fn()
      const result = renderSetRow({ onPress })
      const rowOnPress = result.props.onPress as () => void
      rowOnPress()
      expect(onPress).toHaveBeenCalledOnce()
    })
  })

  describe('skip button', () => {
    it('renders skip text in active state when onSkip is provided', () => {
      const result = renderSetRow({ status: 'active', onSkip: vi.fn() })
      const textNodes = findByType(result, 'Text')
      const skipNode = textNodes.find(t => t.props.children === 'Skip')
      expect(skipNode).toBeDefined()
    })

    it('has correct accessibility label on skip button', () => {
      const result = renderSetRow({
        status: 'active',
        setNumber: 3,
        onSkip: vi.fn()
      })
      const skipButton = findByAccessibilityLabel(result, 'Skip set 3')
      expect(skipButton).toBeDefined()
    })

    it('fires onSkip callback when skip is pressed', () => {
      const onSkip = vi.fn()
      const result = renderSetRow({ status: 'active', onSkip })
      const skipButton = findByAccessibilityLabel(result, 'Skip set 1')
      expect(skipButton).toBeDefined()
      const onPress = skipButton!.props.onPress as () => void
      onPress()
      expect(onSkip).toHaveBeenCalledOnce()
    })

    it('does not render skip in pending state', () => {
      const result = renderSetRow({ status: 'pending', onSkip: vi.fn() })
      const skipButton = findByAccessibilityLabel(result, 'Skip set 1')
      expect(skipButton).toBeUndefined()
    })

    it('does not render skip in completed state', () => {
      const result = renderSetRow({ status: 'completed', onSkip: vi.fn() })
      const skipButton = findByAccessibilityLabel(result, 'Skip set 1')
      expect(skipButton).toBeUndefined()
    })

    it('does not render skip in editing state', () => {
      const result = renderSetRow({ status: 'editing', onSkip: vi.fn() })
      const skipButton = findByAccessibilityLabel(result, 'Skip set 1')
      expect(skipButton).toBeUndefined()
    })

    it('does not render skip when onSkip is not provided', () => {
      const result = renderSetRow({ status: 'active' })
      const textNodes = findByType(result, 'Text')
      const skipNode = textNodes.find(t => t.props.children === 'Skip')
      expect(skipNode).toBeUndefined()
    })
  })

  describe('focus state', () => {
    it('renders focused reps field with focus indicator', () => {
      const result = renderSetRow({ isRepsFocused: true })
      const allNodes = collectAllNodes(result)
      const repsField = allNodes.find(
        n => n.props.accessibilityLabel === 'reps, 8'
      )
      expect(repsField).toBeDefined()
      const style = repsField!.props.style as unknown[]
      const hasFocusStyle = style.some(
        (s: unknown) => s && typeof s === 'object' && 'borderColor' in s
      )
      expect(hasFocusStyle).toBe(true)
    })

    it('renders focused weight field with focus indicator', () => {
      const result = renderSetRow({ isWeightFocused: true })
      const allNodes = collectAllNodes(result)
      const weightField = allNodes.find(
        n => n.props.accessibilityLabel === 'weight, 135'
      )
      expect(weightField).toBeDefined()
      const style = weightField!.props.style as unknown[]
      const hasFocusStyle = style.some(
        (s: unknown) => s && typeof s === 'object' && 'borderColor' in s
      )
      expect(hasFocusStyle).toBe(true)
    })
  })
})
