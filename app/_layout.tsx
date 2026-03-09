import { LoadingScreen } from '@/components/common/LoadingScreen'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { theme } from '@/theme/theme'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts
} from '@expo-google-fonts/dm-sans'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Toast from 'react-native-toast-message'

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync()

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        headerShown: false,
        headerTitleStyle: {
          fontFamily: theme.fonts.semiBold
        },
        contentStyle: styles.scene
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Home', headerShown: false }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ title: 'Home', headerShown: false }}
      />
      <Stack.Screen
        name="(auth)"
        options={{ title: 'Authentication', headerShown: false }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return <LoadingScreen message="Loading app..." />
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <DataProvider>
          <RootLayoutNav />
          <StatusBar style="light" />
          <Toast />
        </DataProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  scene: {
    backgroundColor: theme.colors.background
  }
})
