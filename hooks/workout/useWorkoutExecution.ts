import {
  WorkoutExecutionContext,
  type WorkoutExecutionContextValue
} from '@/context/WorkoutExecutionContext'
import { useContext } from 'react'

export function useWorkoutExecution(): WorkoutExecutionContextValue {
  const ctx = useContext(WorkoutExecutionContext)
  if (!ctx) {
    throw new Error(
      'useWorkoutExecution must be used within a WorkoutExecutionProvider'
    )
  }
  return ctx
}
