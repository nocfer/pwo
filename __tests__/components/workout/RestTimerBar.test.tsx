import { describe, expect, it, vi } from 'vitest'
import React from 'react'

import { RestTimerBar } from '@/components/workout/RestTimerBar'

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
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
  View: ({
    children,
    style,
    accessibilityRole,
    accessibilityLabel,
    accessibilityLiveRegion
  }: Record<string, unknown>) => ({
    type: 'View',
    props: {
      children,
      style,
      accessibilityRole,
      accessibilityLabel,
      accessibilityLiveRegion
    }
  }),
  StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T): T => styles
  }
}))

vi.mock('react-native-reanimated', () => ({
  default: {
    View: ({
      children,
      style,
      accessibilityRole,
      accessibilityLabel,
      accessibilityLiveRegion
    }: Record<string, unknown>) => ({
      type: 'Animated.View',
      props: {
        children,
        style,
        accessibilityRole,
        accessibilityLabel,
        accessibilityLiveRegion
      }
    })
  },
  useSharedValue: (v: number) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  withSequence: vi.fn(),
  withTiming: vi.fn(),
  runOnJS: (fn: Function) => fn
}))

let mockStateCall = 0
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (typeof initial === 'boolean') {
        mockStateCall++
        return [initial, vi.fn()]
      }
      return [initial, vi.fn()]
    },
    useEffect: vi.fn()
  }
})

function renderBar(remainingMs: number, isActive: boolean, onSkip = vi.fn()) {
  mockStateCall = 0
  return RestTimerBar({ remainingMs, isActive, onSkip })
}

describe('RestTimerBar', () => {
  it('returns null when isActive is false', () => {
    const result = renderBar(0, false)
    expect(result).toBeNull()
  })

  it('renders countdown in M:SS format (90000ms → "1:30")', () => {
    const result = renderBar(90000, true)
    const children = result?.props.children as unknown[]
    const countdownText = children[1] as {
      type: string
      props: { children: string }
    }
    expect(countdownText.props.children).toBe('1:30')
  })

  it('renders countdown for 5000ms as "0:05"', () => {
    const result = renderBar(5000, true)
    const children = result?.props.children as unknown[]
    const countdownText = children[1] as {
      type: string
      props: { children: string }
    }
    expect(countdownText.props.children).toBe('0:05')
  })

  it('renders "Rest" label', () => {
    const result = renderBar(60000, true)
    const children = result?.props.children as unknown[]
    const label = children[0] as { type: string; props: { children: string } }
    expect(label.props.children).toBe('Rest')
  })

  it('renders "Skip" button', () => {
    const result = renderBar(60000, true)
    const children = result?.props.children as unknown[]
    const skipButton = children[2] as {
      type: string
      props: { children: unknown }
    }
    const skipText = skipButton.props.children as {
      type: string
      props: { children: string }
    }
    expect(skipText.props.children).toBe('SKIP')
  })

  it('calls onSkip when Skip button is pressed', () => {
    const onSkip = vi.fn()
    const result = renderBar(60000, true, onSkip)
    const children = result?.props.children as unknown[]
    const skipButton = children[2] as {
      type: string
      props: { onPress: () => void }
    }
    skipButton.props.onPress()
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('has accessibilityRole="timer"', () => {
    const result = renderBar(60000, true)
    expect(result?.props.accessibilityRole).toBe('timer')
  })

  it('has correct accessibilityLabel with remaining time', () => {
    const result = renderBar(90000, true)
    expect(result?.props.accessibilityLabel).toBe(
      'Rest timer, 1 minute 30 seconds remaining'
    )
  })

  it('has accessibilityLabel with 0 seconds for 0ms', () => {
    const result = renderBar(0, true)
    expect(result?.props.accessibilityLabel).toBe(
      'Rest timer, 0 seconds remaining'
    )
  })

  it('has accessibilityLiveRegion="polite"', () => {
    const result = renderBar(60000, true)
    expect(result?.props.accessibilityLiveRegion).toBe('polite')
  })

  it('renders countdown for exactly 60s as "1:00"', () => {
    const result = renderBar(60000, true)
    const children = result?.props.children as unknown[]
    const countdownText = children[1] as {
      type: string
      props: { children: string }
    }
    expect(countdownText.props.children).toBe('1:00')
  })
})
