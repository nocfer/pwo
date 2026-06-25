# Active-Workout native surfaces — build & verify

The mini-bar (step 1) is pure RN and runs everywhere. The iOS Live Activity /
Dynamic Island (step 2) and the Android ongoing notification (step 3) need
native code and a **rebuilt custom dev client — not Expo Go**.

## What's wired

- **Widget extension** — `targets/widget/` (built by `@bacons/apple-targets` at
  prebuild): `index.swift` (lock screen + Dynamic Island UI), shared
  `WorkoutActivityAttributes.swift`, `RestActionsIntent.swift` (+15s / Skip App
  Intents, iOS 17+).
- **JS↔ActivityKit bridge** — local Expo module `modules/live-activity/`
  (`ios/LiveActivityModule.swift`) exposing start / update / end /
  consumePendingAction; JS wrapper in `modules/live-activity/index.ts`.
- **Lifecycle** — `hooks/workout/useLiveActivitySync.ts` (mounted in the session
  route) starts on workout start, updates on rest start / +15s / set advance,
  ends on complete / unmount. The countdown ticks natively via
  `Text(timerInterval:)` (no pushes).
- **Lock-screen actions** — the App Intents queue `extend` / `skip` into the App
  Group; `useActiveWorkoutSurface` drains them on foreground and applies the
  existing reducer actions (`EXTEND_REST` / `DISMISS_REST_TIMER`).

## Required before building

1. **Add your Apple Team ID** to `app.json` → `ios.appleTeamId` (prebuild warns
   without it; the widget target won't sign / the App Group won't link).
2. Confirm the App Group `group.com.anonymous.progressiveworkout` exists in your
   Apple Developer account (or change the id consistently in `app.json`,
   `targets/widget/expo-target.config.js`, `RestActionsIntent.swift`,
   `LiveActivityModule.swift`).

## Android (step 3) — ongoing notification + foreground service

Same `live-activity` module, Android side:

- `android/.../LiveActivityModule.kt` — start/update/end map to a foreground
  service; `consumePendingAction` reads SharedPreferences.
- `WorkoutTimerService.kt` — `specialUse` foreground service posting an ongoing
  notification. Resting → a **countdown chronometer** (`setWhen(restEndsAt)` +
  `setChronometerCountDown(true)`, ticks without updates) with **+15s / Skip**
  actions; in-progress → an elapsed chronometer with a Resume tap target.
- `RestActionReceiver.kt` — notification buttons queue `extend` / `skip` to
  SharedPreferences (Skip also stops the service); the app drains them on
  foreground via the same `useActiveWorkoutSurface` path as iOS. **No App Group
  / special signing needed on Android.**
- Permissions added to `app.json`: `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE`,
  `FOREGROUND_SERVICE_SPECIAL_USE` (runtime POST_NOTIFICATIONS is already
  requested via the existing `requestNotificationPermission()`).

## Known limitation — lock-screen actions vs. the live session

The session's `WorkoutExecutionProvider` reads MMKV once at mount and holds its
state in memory. When a lock-screen / notification **+15s / Skip** is drained by
`useActiveWorkoutSurface` (tab layer) and written back to MMKV while the session
screen is still mounted underneath, the provider's next dispatch can overwrite
that change (lost update). On iOS this is moot under free signing (the App Group
is off, so the App Intents no-op); on Android it is a real edge case. Fix during
native bring-up by having the session reconcile from MMKV on foreground
(`RESTORE_STATE`) or by routing the drained action through the live reducer.

## Build

```bash
npx expo prebuild --clean          # regenerates ios/ (widget) + android/ (module)
npx expo run:ios                   # or open ios/*.xcworkspace in Xcode
npx expo run:android
```

Live Activities require **iOS 16.2+**; interactive buttons require **iOS 17+**.
Android chronometer countdown requires **API 24+**; typed FGS requires API 34+.

## Verify on device/simulator

**iOS**
1. Start a workout, log a set to begin rest → Live Activity on the lock screen;
   Dynamic Island shows the compact ring + `m:ss`.
2. Confirm the countdown ticks without the app foregrounded.
3. +15s / Skip on the lock screen work only with the App Group restored (see
   above) — they're intentional no-ops under free-account signing.
4. Complete the workout → activity ends.

**Android**
1. Start a workout, log a set → ongoing notification with a counting-down
   chronometer + +15s / Skip.
2. Background the app → notification persists and keeps ticking.
3. Tap +15s / Skip, reopen the app → rest reflects the action.
4. Complete the workout → notification clears.
