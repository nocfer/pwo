/**
 * ProgressCardError - Inline failed-load state for a Statistics card.
 * Shared so every progress card surfaces a load failure (with retry) the same
 * way instead of repeating the card + ErrorScreen + refreshProgress wiring.
 */

import { ErrorScreen } from '@/components/common'
import { useDataContext } from '@/context/DataContext'
import { theme } from '@/theme/theme'
import { StyleSheet, View } from 'react-native'

type Props = {
  title: string
  message?: string
}

export default function ProgressCardError({
  title,
  message = 'Check your connection and try again.'
}: Props) {
  const { actions } = useDataContext()
  return (
    <View style={styles.card}>
      <ErrorScreen
        inline
        title={title}
        message={message}
        onRetry={actions.refreshProgress}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm
  }
})
