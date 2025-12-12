import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Centralized haptics utility for consistent feedback throughout the app
 */

// Check if haptics are available (iOS only for expo-haptics)
const isHapticsAvailable = Platform.OS === "ios";

/**
 * Light tap - for minor interactions like button taps, toggles
 */
export async function tapLight() {
  if (!isHapticsAvailable) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Medium tap - for confirmations, selections
 */
export async function tapMedium() {
  if (!isHapticsAvailable) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Heavy tap - for important actions, deletions
 */
export async function tapHeavy() {
  if (!isHapticsAvailable) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

/**
 * Success notification - for successful completions
 */
export async function notifySuccess() {
  if (!isHapticsAvailable) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Warning notification - for skips, cancellations
 */
export async function notifyWarning() {
  if (!isHapticsAvailable) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

/**
 * Error notification - for errors, failures
 */
export async function notifyError() {
  if (!isHapticsAvailable) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/**
 * Selection changed - for picker/selection changes
 */
export async function selectionChanged() {
  if (!isHapticsAvailable) return;
  await Haptics.selectionAsync();
}

// Semantic haptic functions for specific app actions
export const haptics = {
  // Navigation & UI
  buttonTap: tapLight,
  tabSwitch: selectionChanged,

  // Workout actions
  setComplete: notifySuccess,
  sessionComplete: notifySuccess,
  skipAction: notifyWarning,
  pauseTimer: tapLight,
  resumeTimer: tapMedium,

  // General
  refresh: tapLight,
  swipeAction: tapMedium,
  celebration: notifySuccess
};

export default haptics;
