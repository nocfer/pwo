import { describe, expect, it, vi } from 'vitest'
import React from 'react'

import { NumericKeypad } from '@/components/workout/NumericKeypad'
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

function renderKeypad(
  overrides?: Partial<Parameters<typeof NumericKeypad>[0]>
) {
  return NumericKeypad({
    onDigit: vi.fn(),
    onBackspace: vi.fn(),
    onDone: vi.fn(),
    ...overrides
  })
}

describe('NumericKeypad', () => {
  describe('key rendering', () => {
    it('renders all 10 digit keys (0-9)', () => {
      const result = renderKeypad()
      const allNodes = collectAllNodes(result)
      const pressables = allNodes.filter(n => n.type === 'Pressable')
      const digitLabels = pressables
        .map(p => p.props.accessibilityLabel as string)
        .filter(l => l?.startsWith('digit '))
      expect(digitLabels.length).toBe(10)
      for (let d = 0; d <= 9; d++) {
        expect(digitLabels).toContain(`digit ${d}`)
      }
    })

    it('renders backspace key', () => {
      const result = renderKeypad()
      const node = findByAccessibilityLabel(result, 'backspace')
      expect(node).toBeDefined()
    })

    it('renders done key', () => {
      const result = renderKeypad()
      const node = findByAccessibilityLabel(result, 'done, dismiss keypad')
      expect(node).toBeDefined()
    })

    it('renders 12 keys total', () => {
      const result = renderKeypad()
      const pressables = findByType(result, 'Pressable')
      expect(pressables.length).toBe(12)
    })
  })

  describe('callbacks', () => {
    it('fires onDigit with correct digit when digit key pressed', () => {
      const onDigit = vi.fn()
      const result = renderKeypad({ onDigit })
      const digit5 = findByAccessibilityLabel(result, 'digit 5')
      expect(digit5).toBeDefined()
      const onPress = digit5!.props.onPress as () => void
      onPress()
      expect(onDigit).toHaveBeenCalledWith(5)
    })

    it('fires onDigit(0) for the zero key', () => {
      const onDigit = vi.fn()
      const result = renderKeypad({ onDigit })
      const digit0 = findByAccessibilityLabel(result, 'digit 0')
      expect(digit0).toBeDefined()
      const onPress = digit0!.props.onPress as () => void
      onPress()
      expect(onDigit).toHaveBeenCalledWith(0)
    })

    it('fires onBackspace when backspace key pressed', () => {
      const onBackspace = vi.fn()
      const result = renderKeypad({ onBackspace })
      const bksp = findByAccessibilityLabel(result, 'backspace')
      expect(bksp).toBeDefined()
      const onPress = bksp!.props.onPress as () => void
      onPress()
      expect(onBackspace).toHaveBeenCalledOnce()
    })

    it('fires onDone when done key pressed', () => {
      const onDone = vi.fn()
      const result = renderKeypad({ onDone })
      const done = findByAccessibilityLabel(result, 'done, dismiss keypad')
      expect(done).toBeDefined()
      const onPress = done!.props.onPress as () => void
      onPress()
      expect(onDone).toHaveBeenCalledOnce()
    })
  })

  describe('accessibility', () => {
    it('all keys have accessibilityRole button', () => {
      const result = renderKeypad()
      const pressables = findByType(result, 'Pressable')
      pressables.forEach(p => {
        expect(p.props.accessibilityRole).toBe('button')
      })
    })

    it('backspace key shows ⌫ character', () => {
      const result = renderKeypad()
      const bksp = findByAccessibilityLabel(result, 'backspace')
      expect(bksp).toBeDefined()
      const textNodes = findByType(bksp!, 'Text')
      const hasBackspaceChar = textNodes.some(t => t.props.children === '⌫')
      expect(hasBackspaceChar).toBe(true)
    })

    it('done key shows "Done" text', () => {
      const result = renderKeypad()
      const done = findByAccessibilityLabel(result, 'done, dismiss keypad')
      expect(done).toBeDefined()
      const textNodes = findByType(done!, 'Text')
      const hasDoneText = textNodes.some(t => t.props.children === 'Done')
      expect(hasDoneText).toBe(true)
    })
  })
})
