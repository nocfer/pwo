import { LoadingScreen } from '@/components/common/LoadingScreen'
import {
  TAB_CONFIG,
  TabIconAnimator
} from '@/components/common/TabIconAnimator'
import { useAuth } from '@/context/AuthContext'
import { haptics } from '@/lib/haptics'
import { theme } from '@/theme/theme'
import { Redirect, Tabs } from 'expo-router'
import { Platform, StyleSheet } from 'react-native'

const tabPressListener = { tabPress: () => haptics.tabSwitch() }

export default function TabLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen message="Loading session..." />
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIconStyle: styles.tabBarIcon
      }}
    >
      {TAB_CONFIG.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <TabIconAnimator icon={icon} color={color} focused={focused} />
            )
          }}
          listeners={tabPressListener}
        />
      ))}
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.borderLight,
    borderTopWidth: 1,
    paddingTop: theme.spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.sm,
    height: Platform.OS === 'ios' ? 84 : 60
  },
  tabBarLabel: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    marginTop: 2
  },
  tabBarIcon: {
    marginTop: 2
  }
})
