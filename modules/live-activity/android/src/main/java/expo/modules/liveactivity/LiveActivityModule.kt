package expo.modules.liveactivity

import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class LiveActivityContentRecord : Record {
  @Field var programName: String = ""
  @Field var isResting: Boolean = false
  @Field var restEndsAtMs: Double = 0.0
  @Field var startedAtMs: Double = 0.0
  @Field var setNumber: Int = 1
  @Field var exerciseName: String = ""
  @Field var weight: Double = 0.0
  @Field var reps: Int = 0
}

class LiveActivityModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No React context")

  override fun definition() = ModuleDefinition {
    Name("LiveActivityModule")

    Function("startActivity") { content: LiveActivityContentRecord ->
      startOrUpdate(content)
      null as String?
    }

    Function("updateActivity") { content: LiveActivityContentRecord ->
      startOrUpdate(content)
    }

    Function("endActivity") {
      context.stopService(Intent(context, WorkoutTimerService::class.java))
    }

    // Drains the action queued by the notification's +15s / Skip buttons.
    Function("consumePendingAction") {
      val prefs = context.getSharedPreferences(
        LiveActivityContract.PREFS_NAME,
        Context.MODE_PRIVATE
      )
      val action = prefs.getString(LiveActivityContract.PENDING_ACTION_KEY, null)
      if (action != null) {
        prefs.edit().remove(LiveActivityContract.PENDING_ACTION_KEY).apply()
      }
      action
    }
  }

  private fun startOrUpdate(content: LiveActivityContentRecord) {
    val intent = Intent(context, WorkoutTimerService::class.java).apply {
      putExtra(LiveActivityContract.EXTRA_PROGRAM_NAME, content.programName)
      putExtra(LiveActivityContract.EXTRA_IS_RESTING, content.isResting)
      putExtra(LiveActivityContract.EXTRA_REST_ENDS_AT_MS, content.restEndsAtMs.toLong())
      putExtra(LiveActivityContract.EXTRA_STARTED_AT_MS, content.startedAtMs.toLong())
      putExtra(LiveActivityContract.EXTRA_SET_NUMBER, content.setNumber)
      putExtra(LiveActivityContract.EXTRA_EXERCISE_NAME, content.exerciseName)
      putExtra(LiveActivityContract.EXTRA_WEIGHT, content.weight)
      putExtra(LiveActivityContract.EXTRA_REPS, content.reps)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      context.startForegroundService(intent)
    } else {
      context.startService(intent)
    }
  }
}
