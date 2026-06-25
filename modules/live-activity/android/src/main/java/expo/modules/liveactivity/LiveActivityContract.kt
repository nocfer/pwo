package expo.modules.liveactivity

/** Shared keys/identifiers used across the module, service, and receiver. */
object LiveActivityContract {
  const val PREFS_NAME = "live_activity_prefs"
  const val PENDING_ACTION_KEY = "pendingRestAction"

  const val CHANNEL_ID = "workout_rest"
  const val CHANNEL_NAME = "Workout"
  const val NOTIFICATION_ID = 4711

  const val ACTION_EXTEND = "extend"
  const val ACTION_SKIP = "skip"

  // Intent extras carrying the current LiveActivityContent into the service.
  const val EXTRA_PROGRAM_NAME = "programName"
  const val EXTRA_IS_RESTING = "isResting"
  const val EXTRA_REST_ENDS_AT_MS = "restEndsAtMs"
  const val EXTRA_STARTED_AT_MS = "startedAtMs"
  const val EXTRA_SET_NUMBER = "setNumber"
  const val EXTRA_EXERCISE_NAME = "exerciseName"
  const val EXTRA_WEIGHT = "weight"
  const val EXTRA_REPS = "reps"

  const val BROADCAST_ACTION = "expo.modules.liveactivity.REST_ACTION"
  const val EXTRA_ACTION = "action"
}
