import { vi } from "vitest";

// Mock expo-file-system
vi.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file://mock/",
  getInfoAsync: vi.fn(),
  readAsStringAsync: vi.fn(),
  writeAsStringAsync: vi.fn()
}));

// Mock react-native Platform
vi.mock("react-native", () => ({
  Platform: { OS: "web" }
}));

// Mock expo-haptics
vi.mock("expo-haptics", () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn()
}));
