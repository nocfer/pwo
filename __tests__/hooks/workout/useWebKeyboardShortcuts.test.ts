import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useWebKeyboardShortcuts } from '@/hooks/workout/useWebKeyboardShortcuts'
import type { WebKeyboardShortcutsConfig } from '@/hooks/workout/useWebKeyboardShortcuts'

type EffectFn = () => (() => void) | void
let effectCallbacks: EffectFn[] = []

vi.mock('react', () => ({
  useEffect: vi.fn((fn: EffectFn) => {
    effectCallbacks.push(fn)
  })
}))

let mockPlatformOS = 'web'
vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return mockPlatformOS
    }
  }
}))

type KeyHandler = (e: Record<string, unknown>) => void
let keydownHandler: KeyHandler | null = null
let removedHandler: KeyHandler | null = null

function setupMockDocument() {
  const mockDoc = {
    addEventListener: vi.fn((event: string, handler: KeyHandler) => {
      if (event === 'keydown') keydownHandler = handler
    }),
    removeEventListener: vi.fn((event: string, handler: KeyHandler) => {
      if (event === 'keydown') removedHandler = handler
    })
  }
  ;(globalThis as Record<string, unknown>).document = mockDoc
  return mockDoc
}

function teardownMockDocument() {
  delete (globalThis as Record<string, unknown>).document
}

function fireKey(key: string, opts: Record<string, unknown> = {}) {
  const prevented = { value: false }
  const event = {
    key,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    preventDefault: vi.fn(() => {
      prevented.value = true
    }),
    ...opts
  }
  keydownHandler?.(event)
  return { event, prevented: prevented.value }
}

function makeConfig(
  overrides: Partial<WebKeyboardShortcutsConfig> = {}
): WebKeyboardShortcutsConfig {
  return {
    onEnter: vi.fn(() => true),
    onTab: vi.fn(() => true),
    onEscape: vi.fn(() => true),
    enabled: true,
    ...overrides
  }
}

function runEffects() {
  effectCallbacks.forEach(fn => fn())
}

function runCleanups() {
  effectCallbacks.forEach(fn => {
    const cleanup = fn()
    if (typeof cleanup === 'function') cleanup()
  })
}

describe('useWebKeyboardShortcuts', () => {
  beforeEach(() => {
    mockPlatformOS = 'web'
    effectCallbacks = []
    keydownHandler = null
    removedHandler = null
    vi.clearAllMocks()
    teardownMockDocument()
  })

  it('fires onEnter with preventDefault on Enter key', () => {
    const mockDoc = setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    expect(mockDoc.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
    const { event } = fireKey('Enter')
    expect(config.onEnter).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('fires onTab with preventDefault on Tab key', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('Tab')
    expect(config.onTab).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('fires onEscape with preventDefault on Escape key', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('Escape')
    expect(config.onEscape).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('fires onDigit with parsed integer for digit keys 0-9', () => {
    setupMockDocument()
    const onDigit = vi.fn()
    const config = makeConfig({ onDigit })
    useWebKeyboardShortcuts(config)
    runEffects()
    fireKey('5')
    expect(onDigit).toHaveBeenCalledWith(5)
    fireKey('0')
    expect(onDigit).toHaveBeenCalledWith(0)
    fireKey('9')
    expect(onDigit).toHaveBeenCalledWith(9)
    expect(onDigit).toHaveBeenCalledTimes(3)
  })

  it('ignores digit keys when onDigit is undefined', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('5')
    expect(config.onEnter).not.toHaveBeenCalled()
    expect(config.onTab).not.toHaveBeenCalled()
    expect(config.onEscape).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('fires onBackspace when callback is provided', () => {
    setupMockDocument()
    const onBackspace = vi.fn()
    const config = makeConfig({ onBackspace })
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('Backspace')
    expect(onBackspace).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('ignores Backspace when onBackspace is undefined', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('Backspace')
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('ignores keys when Ctrl modifier is held', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    fireKey('Enter', { ctrlKey: true })
    expect(config.onEnter).not.toHaveBeenCalled()
  })

  it('ignores keys when Alt modifier is held', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    fireKey('Tab', { altKey: true })
    expect(config.onTab).not.toHaveBeenCalled()
  })

  it('ignores keys when Meta modifier is held', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    fireKey('Escape', { metaKey: true })
    expect(config.onEscape).not.toHaveBeenCalled()
  })

  it('is no-op when Platform.OS is not web', () => {
    mockPlatformOS = 'ios'
    const mockDoc = setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    expect(mockDoc.addEventListener).not.toHaveBeenCalled()
  })

  it('is no-op when enabled is false', () => {
    const mockDoc = setupMockDocument()
    const config = makeConfig({ enabled: false })
    useWebKeyboardShortcuts(config)
    runEffects()
    expect(mockDoc.addEventListener).not.toHaveBeenCalled()
  })

  it('cleans up event listener on unmount', () => {
    const mockDoc = setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runCleanups()
    expect(mockDoc.removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    )
  })

  it('ignores unrecognized keys without errors', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    fireKey('a')
    fireKey('F1')
    fireKey('Shift')
    expect(config.onEnter).not.toHaveBeenCalled()
    expect(config.onTab).not.toHaveBeenCalled()
    expect(config.onEscape).not.toHaveBeenCalled()
  })

  it('skips preventDefault for Enter when callback returns falsy', () => {
    setupMockDocument()
    const config = makeConfig({ onEnter: vi.fn(() => false) })
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('Enter')
    expect(config.onEnter).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('skips preventDefault for Escape when callback returns falsy', () => {
    setupMockDocument()
    const config = makeConfig({ onEscape: vi.fn() })
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('Escape')
    expect(config.onEscape).toHaveBeenCalledTimes(1)
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('ignores Shift+Tab to preserve browser reverse-tab navigation', () => {
    setupMockDocument()
    const config = makeConfig()
    useWebKeyboardShortcuts(config)
    runEffects()
    const { event } = fireKey('Tab', { shiftKey: true })
    expect(config.onTab).not.toHaveBeenCalled()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
