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
