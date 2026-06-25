import { vi } from 'vitest'

// Mock expo-file-system
vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://mock/',
  getInfoAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
  writeAsStringAsync: vi.fn()
}))

// react-native is mocked via resolve alias in vitest.config.ts → __mocks__/react-native.ts

// Mock @/lib/mmkv — the native react-native-mmkv module can't be parsed under
// vitest. A simple in-memory Map stands in. (Per-file mocks still take precedence.)
vi.mock('@/lib/mmkv', () => {
  const map = new Map<string, unknown>()
  return {
    storage: {
      getBoolean: (k: string) => map.get(k) as boolean | undefined,
      getString: (k: string) => map.get(k) as string | undefined,
      getNumber: (k: string) => map.get(k) as number | undefined,
      set: (k: string, v: unknown) => map.set(k, v),
      delete: (k: string) => map.delete(k),
      clearAll: () => map.clear()
    }
  }
})

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning', Error: 'Error' }
}))

// Mock @expo/vector-icons — icons render as a simple resolvable node in tests
vi.mock('@expo/vector-icons', () => ({
  Ionicons: (props: Record<string, unknown>) => ({ type: 'Icon', props })
}))

// Mock react-native-reanimated — Animated.View passes through, hooks return
// plain stand-ins, withX animation helpers resolve to their target value, and
// entering/exiting builders are chainable no-ops. (Per-file mocks still win.)
vi.mock('react-native-reanimated', () => {
  const builder = () => {
    const b: Record<string, () => unknown> = {
      duration: () => b,
      delay: () => b,
      springify: () => b,
      easing: () => b,
      withInitialValues: () => b
    }
    return b
  }
  return {
    default: {
      View: (props: Record<string, unknown>) => ({ type: 'Animated.View', props }),
      // Identity passthrough — the wrapped component renders as-is in tests.
      createAnimatedComponent: (c: unknown) => c
    },
    // Hooks
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn: unknown) => ({
      value: typeof fn === 'function' ? (fn as () => unknown)() : fn
    }),
    useReducedMotion: () => false,
    useAnimatedReaction: () => {},
    // Animation helpers — return the resolved target so reads stay sensible
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    withSequence: (...vals: unknown[]) => vals[vals.length - 1],
    withDelay: (_d: unknown, v: unknown) => v,
    withRepeat: (v: unknown) => v,
    cancelAnimation: () => {},
    interpolate: () => 0,
    interpolateColor: () => '#000000',
    runOnJS: (fn: unknown) => fn,
    Easing: {
      bezier: () => (t: number) => t,
      linear: (t: number) => t,
      ease: (t: number) => t,
      inOut: (e: unknown) => e,
      out: (e: unknown) => e,
      in: (e: unknown) => e
    },
    // Layout-animation builders
    SlideInDown: builder(),
    SlideOutDown: builder(),
    SlideInUp: builder(),
    SlideOutUp: builder(),
    FadeIn: builder(),
    FadeOut: builder(),
    FadeInDown: builder(),
    FadeOutDown: builder(),
    LinearTransition: builder()
  }
})
