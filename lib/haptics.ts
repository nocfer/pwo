import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'
import { storage } from './mmkv'

/**
 * Centralized haptics utility for consistent feedback throughout the app
 */

const HAPTICS_ENABLED_KEY = 'settings.hapticsEnabled'

/** Whether the user has haptics turned on (default true). */
export function getHapticsEnabled(): boolean {
  return storage.getBoolean(HAPTICS_ENABLED_KEY) ?? true
}

/** Persist the user's haptics preference. */
export function setHapticsEnabled(enabled: boolean): void {
  storage.set(HAPTICS_ENABLED_KEY, enabled)
}

// Haptics fire only on iOS (expo-haptics no-ops elsewhere) and only when the
// user hasn't disabled them in settings.
const isHapticsAvailable = () => Platform.OS === 'ios' && getHapticsEnabled()

/**
 * Light tap - for minor interactions like button taps, toggles
 */
export async function tapLight() {
  if (!isHapticsAvailable()) return
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch {}
}

/**
 * Medium tap - for confirmations, selections
 */
export async function tapMedium() {
  if (!isHapticsAvailable()) return
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  } catch {}
}

/**
 * Heavy tap - for important actions, deletions
 */
export async function tapHeavy() {
  if (!isHapticsAvailable()) return
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
  } catch {}
}

/**
 * Success notification - for successful completions
 */
export async function notifySuccess() {
  if (!isHapticsAvailable()) return
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  } catch {}
}

/**
 * Warning notification - for skips, cancellations
 */
export async function notifyWarning() {
  if (!isHapticsAvailable()) return
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  } catch {}
}

/**
 * Error notification - for errors, failures
 */
export async function notifyError() {
  if (!isHapticsAvailable()) return
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  } catch {}
}

/**
 * Selection changed - for picker/selection changes
 */
export async function selectionChanged() {
  if (!isHapticsAvailable()) return
  try {
    await Haptics.selectionAsync()
  } catch {}
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
  restTimerFinished: tapLight,
  setConfirmed: tapMedium,
  exerciseCompleted: notifySuccess,
  prDetected: tapHeavy,
  workoutCompleted: notifySuccess,
  navigationTap: selectionChanged,

  // Data Management CRUD operations
  createItem: notifySuccess,
  updateItem: tapMedium,
  deleteItem: tapHeavy,
  bulkDelete: tapHeavy,
  duplicateItem: tapMedium,

  // Data Management Navigation & Selection
  dataTabSwitch: selectionChanged,
  itemSelection: tapLight,
  bulkSelection: tapMedium,
  clearSelection: tapLight,

  // Data Management Search & Filter
  searchFilter: tapLight,
  sortChange: tapLight,

  // Form interactions
  formSave: notifySuccess,
  formCancel: tapLight,
  formValidationError: notifyError,

  // Import/Export operations
  importData: notifySuccess,
  shareData: tapMedium,

  // General
  refresh: tapLight,
  swipeAction: tapMedium,
  celebration: notifySuccess
}

export default haptics
