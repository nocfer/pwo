import { Tabs } from "expo-router";

import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.surface,
          ...Platform.select({
            ios: {
              shadowColor: theme.shadows.sm.shadowColor,
              shadowOpacity: theme.shadows.sm.shadowOpacity,
              shadowOffset: theme.shadows.sm.shadowOffset,
              shadowRadius: theme.shadows.sm.shadowRadius
            },
            android: {
              elevation: theme.shadows.sm.elevation
            }
          })
        },
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: theme.fonts.semiBold,
          fontSize: 18
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: theme.spacing.xs,
          height: Platform.OS === "ios" ? 88 : 64,
          ...Platform.select({
            ios: {
              shadowColor: theme.shadows.md.shadowColor,
              shadowOpacity: theme.shadows.md.shadowOpacity,
              shadowOffset: { width: 0, height: -2 },
              shadowRadius: theme.shadows.md.shadowRadius
            },
            android: {
              elevation: theme.shadows.md.elevation
            }
          })
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.medium,
          fontSize: 12,
          marginTop: theme.spacing.xs
        },
        tabBarIconStyle: {
          marginTop: theme.spacing.xs
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
      />
      <Tabs.Screen
        name="challenges"
        options={{
          headerShown: false,
          title: "Challenges",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "barbell" : "barbell-outline"}
              color={color}
              size={26}
            />
          )
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          headerShown: false,
          title: "Progress",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "stats-chart" : "stats-chart-outline"}
              color={color}
              size={26}
            />
          )
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          headerShown: false,
          title: "Library",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              color={color}
              size={26}
            />
          )
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          headerShown: false,
          title: "About",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? "information-circle" : "information-circle-outline"
              }
              color={color}
              size={26}
            />
          )
        }}
      />
    </Tabs>
  );
}
