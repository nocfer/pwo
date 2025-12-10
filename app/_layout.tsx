import { Stack } from "expo-router";

import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ title:"Routines", headerShown: false }} />
        <Stack.Screen name="routines/[slug]/session/[index]" options={{ title: '', headerShown: true }} />
        <Stack.Screen name="routines/[slug]" options={{ title: '', headerShown: true }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
