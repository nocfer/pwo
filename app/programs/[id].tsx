import { ErrorScreen, LoadingScreen, ScreenHeader } from '@/components'
import ProgramView from '@/components/program/ProgramView'
import QRCodeShareModal from '@/components/program/QRCodeShareModal'
import { useProgramProgress, usePrograms } from '@/hooks/data'
import { theme } from '@/theme/theme'
import { Program } from '@/types'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProgramDetail() {
  const params = useLocalSearchParams()
  const id = params.id as string
  const { data: programs, loading } = usePrograms()
  const [showQRModal, setShowQRModal] = useState(false)

  const program = useMemo(
    () => programs?.find((p: Program) => p.id === id) ?? null,
    [programs, id]
  )

  // Get sessions (generated dynamically for challenge programs)

  const { metrics: programMetrics } = useProgramProgress(program)

  if (loading) {
    return <LoadingScreen />
  }

  if (!program) {
    return <ErrorScreen message="Program not found." />
  }

  const subtitle = program.description

  const handleEditPress = () => {
    router.push(`/library/programs/${id}/edit`)
  }

  const editButton = (
    <Pressable
      onPress={handleEditPress}
      style={({ pressed }) => [
        styles.headerButton,
        pressed && styles.headerButtonPressed
      ]}
    >
      <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
    </Pressable>
  )

  const shareButton = (
    <Pressable
      onPress={() => setShowQRModal(true)}
      style={({ pressed }) => [
        styles.headerButton,
        pressed && styles.headerButtonPressed
      ]}
    >
      <Ionicons name="qr-code-outline" size={22} color={theme.colors.primary} />
    </Pressable>
  )

  const headerRightElement = (
    <View style={styles.headerButtonsContainer}>
      {editButton}
      {shareButton}
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
      <ScreenHeader
        title={program.name}
        subtitle={subtitle}
        rightElement={headerRightElement}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {programMetrics && (
          <ProgramView program={program} programMetrics={programMetrics!} />
        )}
      </ScrollView>
      <QRCodeShareModal
        program={program}
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: theme.spacing.xxl
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm
  },
  headerButton: {
    padding: theme.spacing.xs,
    margin: -theme.spacing.xs
  },
  headerButtonPressed: {
    opacity: 0.6
  }
})
