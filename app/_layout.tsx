import { DataProvider } from "@/context/DataContext";
import { theme } from "@/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();
Ionicons.loadFont = () => Promise.resolve(); // prevent auto-loading broken path

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Ionicons: require("../assets/icons/Ionicons.ttf"),
    DMSans_400Regular: require("../assets/fonts/dm-sans/400Regular/DMSans_400Regular.ttf"),
    DMSans_500Medium: require("../assets/fonts/dm-sans/500Medium/DMSans_500Medium.ttf"),
    DMSans_600SemiBold: require("../assets/fonts/dm-sans/600SemiBold/DMSans_600SemiBold.ttf"),
    DMSans_700Bold: require("../assets/fonts/dm-sans/700Bold/DMSans_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DataProvider>
        <Stack
          screenOptions={{
            animation: "slide_from_right",
            headerShown: false,
            headerTitleStyle: {
              fontFamily: theme.fonts.semiBold,
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ title: "Routines", headerShown: false }}
          />
          <Stack.Screen
            name="routines/[slug]/session/[index]"
            options={{ title: "", headerShown: false }}
          />
          <Stack.Screen
            name="routines/[slug]"
            options={{ title: "", headerShown: false }}
          />
        </Stack>
        <StatusBar style="dark" />
      </DataProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
