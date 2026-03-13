import { useCallback, useEffect, useRef } from 'react'
import type { LayoutChangeEvent, ScrollView } from 'react-native'

type ExerciseLayout = { y: number; height: number }

const ESTIMATED_ROW_HEIGHT = 80

export function useScrollToExercise(
  scrollRef: React.RefObject<ScrollView | null>,
  viewportHeight: number
) {
  const layoutsRef = useRef(new Map<number, ExerciseLayout>())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleExerciseLayout = useCallback(
    (exerciseIndex: number) => (e: LayoutChangeEvent) => {
      const { y, height } = e.nativeEvent.layout
      layoutsRef.current.set(exerciseIndex, { y, height })
    },
    []
  )

  const scrollToExercise = useCallback(
    (exerciseIndex: number) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const layout = layoutsRef.current.get(exerciseIndex)
        const y = layout
          ? layout.y - viewportHeight / 2 + layout.height / 2
          : exerciseIndex * ESTIMATED_ROW_HEIGHT

        const allLayouts = Array.from(layoutsRef.current.values())
        const maxY =
          allLayouts.length > 0
            ? Math.max(...allLayouts.map(l => l.y + l.height)) - viewportHeight
            : Infinity
        const clamped = Math.max(0, Math.min(y, maxY))

        scrollRef.current?.scrollTo({ y: clamped, animated: true })
      }, 100)
    },
    [scrollRef, viewportHeight]
  )

  return { handleExerciseLayout, scrollToExercise }
}
