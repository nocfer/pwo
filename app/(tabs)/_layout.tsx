import { LoadingScreen } from "@/components/common/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { Redirect, Tabs } from "expo-router";

import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform } from "react-native";

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading session..." />;
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface
        },
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.fonts.semiBold,
          fontSize: 17
        },
        animation: "shift",
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderLight,
          borderTopWidth: 1,
          paddingTop: theme.spacing.xs,
          paddingBottom:
            Platform.OS === "ios" ? theme.spacing.xl : theme.spacing.sm,
          height: Platform.OS === "ios" ? 84 : 60
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.medium,
          fontSize: 11,
          marginTop: 2
        },
        tabBarIconStyle: {
          marginTop: 2
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              color={color}
              size={26}
            />
          )
        }}
        listeners={{
          tabPress: () => {
            haptics.tabSwitch();
          }
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          headerShown: false,
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "library" : "library-outline"}
              color={color}
              size={26}
            />
          )
        }}
        listeners={{
          tabPress: () => {
            haptics.tabSwitch();
          }
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          headerShown: false,
          title: "Statistics",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              color={color}
              size={26}
            />
          )
        }}
        listeners={{
          tabPress: () => {
            haptics.tabSwitch();
          }
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={26}
            />
          )
        }}
        listeners={{
          tabPress: () => {
            haptics.tabSwitch();
          }
        }}
      />
    </Tabs>
  );
}
