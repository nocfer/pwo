package expo.modules.liveactivity

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Handles the notification's +15s / Skip buttons. Records the action to shared
 * prefs for the app to reconcile on foreground (consumePendingAction →
 * EXTEND_REST / DISMISS_REST_TIMER in the reducer). Skip also tears the service
 * down so the notification clears immediately.
 */
class RestActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.getStringExtra(LiveActivityContract.EXTRA_ACTION) ?: return

    context
      .getSharedPreferences(LiveActivityContract.PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(LiveActivityContract.PENDING_ACTION_KEY, action)
      .apply()

    if (action == LiveActivityContract.ACTION_SKIP) {
      context.stopService(Intent(context, WorkoutTimerService::class.java))
    }
  }
}
