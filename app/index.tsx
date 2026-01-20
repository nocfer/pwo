/**
 * Root Index - Handles initial routing based on authentication state
 */

import LoadingScreen from "@/components/common/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";

export default function Index() {
  const { user, loading } = useAuth();

  // Show loading while checking auth state
  if (loading) {
    return <LoadingScreen message="Loading session..." />;
  }

  // Redirect based on authentication state
  if (user) {
    // Authenticated users (including guests) go to home
    return <Redirect href="/(tabs)" />;
  } else {
    // Unauthenticated users go to sign-in
    return <Redirect href="/(auth)/sign-in" />;
  }
}

