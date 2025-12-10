import { DataProvider } from "@/context/DataContext";
import { theme } from "@/theme/theme";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
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
