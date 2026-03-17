import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSchedule = vi.fn(async () => 'notif-abc')
const mockCancel = vi.fn(async () => {})
const mockRequestPermissions = vi.fn(async () => ({ status: 'granted' }))
const mockSetHandler = vi.fn()

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' }
}))

vi.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (...args: unknown[]) => mockSchedule(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
  requestPermissionsAsync: (...args: unknown[]) =>
    mockRequestPermissions(...args),
  setNotificationHandler: (...args: unknown[]) => mockSetHandler(...args),
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval'
  }
}))

import {
  scheduleRestTimerNotification,
  cancelRestTimerNotification,
  requestNotificationPermission
} from '@/lib/notifications'

describe('lib/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('scheduleRestTimerNotification', () => {
    it('calls scheduleNotificationAsync with correct trigger', async () => {
      const id = await scheduleRestTimerNotification(90000)
      expect(id).toBe('notif-abc')
      expect(mockSchedule).toHaveBeenCalledWith({
        content: {
          title: 'Rest Complete',
          body: 'Time for your next set',
          sound: true
        },
        trigger: {
          type: 'timeInterval',
          seconds: 90
        }
      })
    })

    it('returns null on error', async () => {
      mockSchedule.mockRejectedValueOnce(new Error('fail'))
      const id = await scheduleRestTimerNotification(60000)
      expect(id).toBeNull()
    })

    it('ensures minimum 1 second trigger', async () => {
      await scheduleRestTimerNotification(100)
      expect(mockSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({ seconds: 1 })
        })
      )
    })
  })

  describe('cancelRestTimerNotification', () => {
    it('calls cancelScheduledNotificationAsync', async () => {
      await cancelRestTimerNotification('notif-123')
      expect(mockCancel).toHaveBeenCalledWith('notif-123')
    })

    it('does not throw on error', async () => {
      mockCancel.mockRejectedValueOnce(new Error('fail'))
      await expect(
        cancelRestTimerNotification('notif-123')
      ).resolves.toBeUndefined()
    })
  })

  describe('requestNotificationPermission', () => {
    it('returns true when granted', async () => {
      mockRequestPermissions.mockResolvedValueOnce({ status: 'granted' })
      const result = await requestNotificationPermission()
      expect(result).toBe(true)
    })

    it('returns false when denied', async () => {
      mockRequestPermissions.mockResolvedValueOnce({ status: 'denied' })
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      mockRequestPermissions.mockRejectedValueOnce(new Error('fail'))
      const result = await requestNotificationPermission()
      expect(result).toBe(false)
    })
  })
})
