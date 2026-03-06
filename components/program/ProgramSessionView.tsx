import { useExercises } from '@/hooks'
import {
  UseStepCompletionReturn,
  UseWorkoutTimerReturn,
  WorkoutStep
} from '@/hooks/session'
import { Exercise, Program, ProgramSession } from '@/types'
import { useMemo } from 'react'
import { WorkoutExecutionScreen } from './WorkoutExecutionScreen'

type Props = {
  session: ProgramSession
  timer: UseWorkoutTimerReturn
  steps: WorkoutStep[]
  program: Program
  stepCompletion: UseStepCompletionReturn
  onProgramUpdate?: (program: Program) => Promise<void>
  onCompletedSetsChange?: (
    sets: {
      exerciseId: string
      actualReps: number
      setNumber: number
      totalSets: number
    }[]
  ) => void
}

export default function ProgramSessionView({
  session,
  timer,
  steps,
  program,
  stepCompletion,
  onProgramUpdate,
  onCompletedSetsChange
}: Props) {
  const { data: exercises } = useExercises()

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>()
    ;(exercises ?? []).forEach((e: Exercise) => map.set(e.id, e.name))
    return map
  }, [exercises])

  return (
    <WorkoutExecutionScreen
      session={session}
      timer={timer}
      steps={steps}
      program={program}
      exerciseNameById={exerciseNameById}
      stepCompletion={stepCompletion}
      onProgramUpdate={onProgramUpdate}
      onCompletedSetsChange={onCompletedSetsChange}
    />
  )
}
