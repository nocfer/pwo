import { LoadingScreen } from '@/components/common/LoadingScreen'
import { useAuth } from '@/context/AuthContext'
import { theme } from '@/theme/theme'
import { Redirect, Stack } from 'expo-router'

export default function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Loading session..." />
  }

  if (user) {
    return <Redirect href="/(tabs)" />
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.background
        }
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  )
}
