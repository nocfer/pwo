import { ErrorScreen, LoadingScreen, ScreenHeader } from '@/components'
import ChallengeView from '@/components/challenge/ChallengeView'
import ProgramView from '@/components/program/ProgramView'
import QRCodeShareModal from '@/components/program/QRCodeShareModal'
import {
  useChallengeProgress,
  useChallengeSessions,
  useProgramProgress,
  usePrograms
} from '@/hooks/data'
import { formatCount } from '@/lib/utils/format'
import { theme } from '@/theme/theme'
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
    () => programs?.find(p => p.id === id) ?? null,
    [programs, id]
  )

  // Get sessions (generated dynamically for challenge programs)
  const sessions = useChallengeSessions(program)
  const isChallenge = Boolean(program?.challengeConfig)
  const { metrics: challengeMetrics } = useChallengeProgress(
    isChallenge ? program : undefined
  )
  const { metrics: programMetrics } = useProgramProgress(
    !isChallenge ? program : undefined
  )

  if (loading) {
    return <LoadingScreen />
  }

  if (!program) {
    return <ErrorScreen message="Program not found." />
  }

  const subtitle = program.description
    ? program.description
    : formatCount(sessions.length, 'session')

  const handleEditPress = () => {
    if (isChallenge) {
      router.push(`/library/challenges/${id}/edit`)
    } else {
      router.push(`/library/programs/${id}/edit`)
    }
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
        {isChallenge && (
          <ChallengeView
            challengeMetrics={challengeMetrics!}
            program={program}
          />
        )}
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
