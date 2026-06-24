import { vi } from 'vitest'

// Mock expo-file-system
vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://mock/',
  getInfoAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
  writeAsStringAsync: vi.fn()
}))

// react-native is mocked via resolve alias in vitest.config.ts → __mocks__/react-native.ts

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn()
}))

// Mock @expo/vector-icons — icons render as a simple resolvable node in tests
vi.mock('@expo/vector-icons', () => ({
  Ionicons: (props: Record<string, unknown>) => ({ type: 'Icon', props })
}))
