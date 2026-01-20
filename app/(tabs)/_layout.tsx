import { LoadingScreen } from "@/components/common/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { Redirect, Tabs } from "expo-router";

import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform } from "react-native";

type TabIconName = "home" | "library" | "stats-chart" | "person";

const TAB_CONFIG = [
  { name: "index", title: "Home", icon: "home" as TabIconName },
  { name: "library", title: "Library", icon: "library" as TabIconName },
  { name: "progress", title: "Statistics", icon: "stats-chart" as TabIconName },
  { name: "profile", title: "Profile", icon: "person" as TabIconName }
] as const;

const tabPressListener = { tabPress: () => haptics.tabSwitch() };

function TabIcon({
  icon,
  color,
  focused
}: {
  icon: TabIconName;
  color: string;
  focused: boolean;
}) {
  const name = focused ? icon : (`${icon}-outline` as const);
  return <Ionicons name={name} color={color} size={26} />;
}

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
      {TAB_CONFIG.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icon} color={color} focused={focused} />
            )
          }}
          listeners={tabPressListener}
        />
      ))}
    </Tabs>
  );
}
