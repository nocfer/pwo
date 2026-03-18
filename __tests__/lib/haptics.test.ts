import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { haptics } from '@/lib/haptics'

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn(),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
  NotificationFeedbackType: {
    Success: 'Success',
    Warning: 'Warning',
    Error: 'Error'
  }
}))

describe('haptics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Platform.OS = 'ios'
  })

  describe('semantic workout functions exist', () => {
    it('has setConfirmed', () => {
      expect(typeof haptics.setConfirmed).toBe('function')
    })

    it('has exerciseCompleted', () => {
      expect(typeof haptics.exerciseCompleted).toBe('function')
    })

    it('has prDetected', () => {
      expect(typeof haptics.prDetected).toBe('function')
    })

    it('has workoutCompleted', () => {
      expect(typeof haptics.workoutCompleted).toBe('function')
    })

    it('has navigationTap', () => {
      expect(typeof haptics.navigationTap).toBe('function')
    })

    it('has restTimerFinished', () => {
      expect(typeof haptics.restTimerFinished).toBe('function')
    })
  })

  describe('workout-specific function mappings', () => {
    it('setConfirmed calls impactAsync with Medium', async () => {
      await haptics.setConfirmed()
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      )
    })

    it('exerciseCompleted calls notificationAsync with Success', async () => {
      await haptics.exerciseCompleted()
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      )
    })

    it('prDetected calls impactAsync with Heavy', async () => {
      await haptics.prDetected()
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Heavy
      )
    })

    it('workoutCompleted calls notificationAsync with Success', async () => {
      await haptics.workoutCompleted()
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      )
    })

    it('navigationTap calls selectionAsync', async () => {
      await haptics.navigationTap()
      expect(Haptics.selectionAsync).toHaveBeenCalled()
    })

    it('restTimerFinished calls impactAsync with Light', async () => {
      await haptics.restTimerFinished()
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      )
    })
  })

  describe('web safety — all functions no-op when not iOS', () => {
    beforeEach(() => {
      Platform.OS = 'web'
    })

    it('setConfirmed no-ops on web', async () => {
      await haptics.setConfirmed()
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('exerciseCompleted no-ops on web', async () => {
      await haptics.exerciseCompleted()
      expect(Haptics.notificationAsync).not.toHaveBeenCalled()
    })

    it('prDetected no-ops on web', async () => {
      await haptics.prDetected()
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('workoutCompleted no-ops on web', async () => {
      await haptics.workoutCompleted()
      expect(Haptics.notificationAsync).not.toHaveBeenCalled()
    })

    it('navigationTap no-ops on web', async () => {
      await haptics.navigationTap()
      expect(Haptics.selectionAsync).not.toHaveBeenCalled()
    })

    it('restTimerFinished no-ops on web', async () => {
      await haptics.restTimerFinished()
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })
  })

  describe('existing functions still work', () => {
    it('buttonTap calls impactAsync with Light', async () => {
      await haptics.buttonTap()
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      )
    })

    it('tabSwitch calls selectionAsync', async () => {
      await haptics.tabSwitch()
      expect(Haptics.selectionAsync).toHaveBeenCalled()
    })

    it('skipAction calls notificationAsync with Warning', async () => {
      await haptics.skipAction()
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Warning
      )
    })
  })
})
