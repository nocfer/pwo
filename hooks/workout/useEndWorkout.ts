import { haptics } from '@/lib/haptics'
import { useWorkoutExecution } from './useWorkoutExecution'
import { useCallback, useMemo, useState } from 'react'

export function useEndWorkout() {
  const { state, completeWorkout } = useWorkoutExecution()
  const [showEndConfirmation, setShowEndConfirmation] = useState(false)

  const pendingSetsCount = useMemo(
    () =>
      state.exercises.reduce(
        (count, ex) =>
          count +
          ex.sets.filter(s => s.status === 'pending' || s.status === 'active')
            .length,
        0
      ),
    [state.exercises]
  )

  const requestEnd = useCallback(() => {
    setShowEndConfirmation(true)
  }, [])

  const confirmEnd = useCallback(() => {
    completeWorkout()
    setShowEndConfirmation(false)
    haptics.workoutCompleted()
  }, [completeWorkout])

  const cancelEnd = useCallback(() => {
    setShowEndConfirmation(false)
  }, [])

  return {
    showEndConfirmation,
    pendingSetsCount,
    requestEnd,
    confirmEnd,
    cancelEnd
  }
}
