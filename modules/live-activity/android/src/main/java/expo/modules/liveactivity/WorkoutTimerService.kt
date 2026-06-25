package expo.modules.liveactivity

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Foreground service backing the Android "active workout" surface: an ongoing
 * notification that survives backgrounding. When resting it shows a countdown
 * chronometer (driven by the system clock via setWhen + chronometerCountDown,
 * so it ticks without updates) plus +15s / Skip actions; otherwise it shows the
 * in-progress elapsed time with a Resume tap target.
 */
class WorkoutTimerService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    createChannel()
    val notification = buildNotification(intent)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        LiveActivityContract.NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
      )
    } else {
      startForeground(LiveActivityContract.NOTIFICATION_ID, notification)
    }
    return START_STICKY
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(LiveActivityContract.CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      LiveActivityContract.CHANNEL_ID,
      LiveActivityContract.CHANNEL_NAME,
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      setShowBadge(false)
      enableVibration(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun buildNotification(intent: Intent?): Notification {
    val programName = intent?.getStringExtra(LiveActivityContract.EXTRA_PROGRAM_NAME) ?: "Workout"
    val isResting = intent?.getBooleanExtra(LiveActivityContract.EXTRA_IS_RESTING, false) ?: false
    val restEndsAt = intent?.getLongExtra(LiveActivityContract.EXTRA_REST_ENDS_AT_MS, 0L) ?: 0L
    val startedAt = intent?.getLongExtra(LiveActivityContract.EXTRA_STARTED_AT_MS, 0L) ?: 0L
    val setNumber = intent?.getIntExtra(LiveActivityContract.EXTRA_SET_NUMBER, 1) ?: 1
    val exerciseName = intent?.getStringExtra(LiveActivityContract.EXTRA_EXERCISE_NAME) ?: ""

    val builder = NotificationCompat.Builder(this, LiveActivityContract.CHANNEL_ID)
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
      .setContentIntent(openAppIntent())
      .setColor(0xFF56E0F0.toInt())

    if (isResting && restEndsAt > 0L) {
      builder
        .setContentTitle("Resting")
        .setContentText("Next · Set $setNumber · $exerciseName")
        .setUsesChronometer(true)
        .setWhen(restEndsAt)
        .addAction(0, "+15s", actionIntent(LiveActivityContract.ACTION_EXTEND))
        .addAction(0, "Skip", actionIntent(LiveActivityContract.ACTION_SKIP))
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        builder.setChronometerCountDown(true)
      }
    } else {
      builder
        .setContentTitle("Workout in progress")
        .setContentText("$programName · Set $setNumber · $exerciseName")
        .setUsesChronometer(true)
        .setWhen(if (startedAt > 0L) startedAt else System.currentTimeMillis())
    }

    return builder.build()
  }

  private fun openAppIntent(): PendingIntent {
    val launch = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
    return PendingIntent.getActivity(
      this,
      0,
      launch ?: Intent(),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun actionIntent(action: String): PendingIntent {
    val intent = Intent(this, RestActionReceiver::class.java).apply {
      this.action = LiveActivityContract.BROADCAST_ACTION
      putExtra(LiveActivityContract.EXTRA_ACTION, action)
    }
    return PendingIntent.getBroadcast(
      this,
      action.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
