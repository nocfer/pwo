import { WorkoutStep } from '@/hooks/session'
import { theme } from '@/theme/theme'

export function getPhaseInfo(timerPhase: string, stepType?: string) {
  const phaseKind =
    timerPhase === 'done'
      ? 'done'
      : stepType === 'warmup'
        ? 'warmup'
        : stepType === 'rest'
          ? 'break'
          : 'working'
  const phaseBg =
    phaseKind === 'warmup'
      ? theme.colors.phases.warmupBg
      : phaseKind === 'break'
        ? theme.colors.phases.breakBg
        : phaseKind === 'working'
          ? theme.colors.phases.workingBg
          : theme.colors.phases.doneBg
  const phaseAccent =
    phaseKind === 'warmup'
      ? theme.colors.phases.warmup
      : phaseKind === 'break'
        ? theme.colors.phases.break
        : phaseKind === 'working'
          ? theme.colors.phases.working
          : theme.colors.phases.done

  return {
    phaseKind,
    phaseBg,
    phaseAccent
  }
}
export function getPhaseColors(stepType: WorkoutStep['type']) {
  let cardActiveColors: {
    borderColor: string
    backgroundColor: string
  }

  switch (stepType) {
    case 'warmup':
      cardActiveColors = {
        borderColor: theme.colors.phases.warmup,

        backgroundColor: theme.colors.phases.warmupBg
      }
      break
    case 'exercise':
      cardActiveColors = {
        borderColor: theme.colors.phases.working,

        backgroundColor: theme.colors.phases.workingBg
      }
      break
    case 'rest':
      cardActiveColors = {
        borderColor: theme.colors.phases.break,

        backgroundColor: theme.colors.phases.breakBg
      }
      break
    default:
      cardActiveColors = {
        borderColor: theme.colors.phases.warmup,

        backgroundColor: theme.colors.phases.warmupBg
      }
  }
  return cardActiveColors
}
