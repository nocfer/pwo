/**
 * live-activity — local Expo module bridging JS to the iOS ActivityKit Live
 * Activity / Dynamic Island (see targets/widget for the SwiftUI extension).
 *
 * The native module only exists in a custom dev client built with the widget
 * target (not Expo Go / web / Android). requireOptionalNativeModule returns
 * null when it's absent, so every export here degrades to a safe no-op and the
 * app keeps working without a native rebuild.
 */

import { requireOptionalNativeModule } from 'expo-modules-core'
import { Platform } from 'react-native'

type NativeLiveActivityModule = {
  startActivity(content: LiveActivityContent): string | null
  updateActivity(content: LiveActivityContent): void
  endActivity(): void
  consumePendingAction(): PendingRestAction
}

/** Action queued by the lock-screen / Dynamic Island buttons, drained on foreground. */
export type PendingRestAction = 'extend' | 'skip' | null

// iOS → ActivityKit Live Activity / Dynamic Island; Android → a foreground-
// service ongoing notification with a countdown chronometer + actions. Both are
// the same JS surface; only web has no native module.
const native =
  Platform.OS === 'web'
    ? null
    : requireOptionalNativeModule<NativeLiveActivityModule>('LiveActivityModule')

/**
 * The full content state pushed to the Live Activity. The countdown itself is
 * rendered natively from `restEndsAtMs` via SwiftUI `Text(timerInterval:)`, so
 * it ticks on the lock screen / Dynamic Island without any push updates.
 */
export type LiveActivityContent = {
  programName: string
  isResting: boolean
  /** Epoch ms when the current rest ends; drives the native timer text. */
  restEndsAtMs: number
  /** Epoch ms the workout started; drives the Android in-progress chronometer. */
  startedAtMs: number
  setNumber: number
  exerciseName: string
  weight: number
  reps: number
}

/** Start the activity (no-op if one is already running or unsupported). */
export function startLiveActivity(content: LiveActivityContent): void {
  try {
    native?.startActivity(content)
  } catch {
    // ignore — Live Activity is a best-effort presentation layer
  }
}

/** Update the running activity (rest start / +15s / rest end transitions). */
export function updateLiveActivity(content: LiveActivityContent): void {
  try {
    native?.updateActivity(content)
  } catch {
    // ignore
  }
}

/** End the activity (workout complete / dismissed). */
export function endLiveActivity(): void {
  try {
    native?.endActivity()
  } catch {
    // ignore
  }
}

/**
 * Drain (read + clear) the action queued by the widget's +15s / Skip buttons.
 * Call on app foreground; returns null when there's nothing pending.
 */
export function consumePendingRestAction(): PendingRestAction {
  try {
    return native?.consumePendingAction() ?? null
  } catch {
    return null
  }
}
