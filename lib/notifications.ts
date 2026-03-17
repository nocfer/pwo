import { Platform } from 'react-native'

let Notifications: typeof import('expo-notifications') | null = null

async function loadNotifications() {
  if (Platform.OS === 'web') return null
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications')
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false
        })
      })
    } catch {
      return null
    }
  }
  return Notifications
}

export async function scheduleRestTimerNotification(
  delayMs: number
): Promise<string | null> {
  try {
    const mod = await loadNotifications()
    if (!mod) return null
    const seconds = Math.max(1, Math.ceil(delayMs / 1000))
    const id = await mod.scheduleNotificationAsync({
      content: {
        title: 'Rest Complete',
        body: 'Time for your next set',
        sound: true
      },
      trigger: {
        type: mod.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds
      }
    })
    return id
  } catch {
    return null
  }
}

export async function cancelRestTimerNotification(
  notificationId: string
): Promise<void> {
  try {
    const mod = await loadNotifications()
    if (!mod) return
    await mod.cancelScheduledNotificationAsync(notificationId)
  } catch {
    // Silently ignore cancellation errors
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const mod = await loadNotifications()
    if (!mod) return true
    const { status } = await mod.requestPermissionsAsync()
    return status === 'granted'
  } catch {
    return false
  }
}
