import { describe, expect, it, vi } from 'vitest'
import React from 'react'

vi.mock('react-native', () => ({
  Pressable: ({
    children,
    onPress,
    accessibilityRole,
    accessibilityLabel,
    accessibilityHint,
    hitSlop,
    style
  }: Record<string, unknown>) => ({
    type: 'Pressable',
    props: {
      children,
      onPress,
      accessibilityRole,
      accessibilityLabel,
      accessibilityHint,
      hitSlop,
      style
    }
  }),
  Text: ({ children, style }: Record<string, unknown>) => ({
    type: 'Text',
    props: { children, style }
  }),
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles
  }
}))

import { SetDot } from '@/components/workout/SetDot'

function renderSetDot(
  status: 'pending' | 'active' | 'completed' | 'skipped',
  setNumber = 1,
  onPress = vi.fn()
) {
  return SetDot({ setNumber, status, onPress })
}

function getTextContent(pressableElement: {
  props: { children: unknown }
}): unknown {
  const child = pressableElement.props.children
  if (child && typeof child === 'object' && 'props' in child) {
    return (child as { props: { children: unknown } }).props.children
  }
  return null
}

describe('SetDot', () => {
  describe('accessibility labels', () => {
    it('renders pending state with correct label', () => {
      const result = renderSetDot('pending', 3)
      expect(result.props.accessibilityLabel).toBe('Set 3, pending')
      expect(result.props.accessibilityRole).toBe('button')
      expect(result.props.accessibilityHint).toBe(
        'Double tap to navigate to this set'
      )
    })

    it('renders active state with "current" label', () => {
      const result = renderSetDot('active', 2)
      expect(result.props.accessibilityLabel).toBe('Set 2, current')
    })

    it('renders completed state with correct label', () => {
      const result = renderSetDot('completed', 1)
      expect(result.props.accessibilityLabel).toBe('Set 1, completed')
    })

    it('renders skipped state with correct label', () => {
      const result = renderSetDot('skipped', 4)
      expect(result.props.accessibilityLabel).toBe('Set 4, skipped')
    })
  })

  describe('content rendering', () => {
    it('renders set number for pending state', () => {
      const result = renderSetDot('pending', 2)
      const content = getTextContent(result)
      expect(content).toBe(2)
    })

    it('renders set number for active state', () => {
      const result = renderSetDot('active', 3)
      const content = getTextContent(result)
      expect(content).toBe(3)
    })

    it('renders checkmark for completed state', () => {
      const result = renderSetDot('completed', 1)
      const content = getTextContent(result)
      expect(content).toBe('✓')
    })

    it('renders dash for skipped state', () => {
      const result = renderSetDot('skipped', 1)
      const content = getTextContent(result)
      expect(content).toBe('–')
    })
  })

  describe('touch target', () => {
    it('has 48pt touch target via hitSlop', () => {
      const result = renderSetDot('pending')
      expect(result.props.hitSlop).toEqual({
        top: 10,
        bottom: 10,
        left: 10,
        right: 10
      })
    })
  })

  describe('onPress', () => {
    it('fires onPress callback', () => {
      const onPress = vi.fn()
      const result = renderSetDot('pending', 1, onPress)
      result.props.onPress()
      expect(onPress).toHaveBeenCalledOnce()
    })
  })
})
