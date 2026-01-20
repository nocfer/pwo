/**
 * Sign In Screen
 *
 * Allows users to sign in with email/password or continue as guest
 */

import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthLayout } from "@/components/auth/AuthLayout";
import Button from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignInScreen() {
  const { signIn, signInAsGuest, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    try {
      await signIn(email, password);
      // Navigation will happen automatically via auth state change
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuestAccess = async () => {
    try {
      await signInAsGuest();
      // Navigation will happen automatically via auth state change
    } catch (err) {
      console.error(err);
    }
  };

  const navigateToSignUp = () => {
    haptics.buttonTap();
    router.push("/(auth)/sign-up");
  };

  const isLoading = loading;

  return (
    <AuthLayout>
      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to continue your fitness journey"
        iconName="fitness"
      />

      <View style={styles.form}>
        <AuthErrorBanner message={error} />

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            editable={!isLoading}
          />
        </View>

        <Button
          label={isLoading ? "Signing in..." : "Sign In"}
          variant="primary"
          size="lg"
          onPress={handleSignIn}
          disabled={isLoading || !email.trim() || !password}
          fullWidth
          style={styles.signInButton}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          label="Continue as Guest"
          variant="secondary"
          size="lg"
          onPress={handleGuestAccess}
          disabled={isLoading}
          fullWidth
          style={styles.guestButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{`Don't have an account? `}</Text>
          <Pressable
            onPress={navigateToSignUp}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.linkButtonPressed
            ]}
          >
            <Text style={styles.linkText}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.lg
  },
  inputGroup: {
    gap: theme.spacing.sm
  },
  label: {
    ...theme.typography.captionBold,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs
  },
  input: {
    ...theme.presets.input,
    height: 44
  },
  signInButton: {
    marginTop: theme.spacing.sm
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    marginVertical: theme.spacing.sm
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border
  },
  dividerText: {
    ...theme.typography.caption,
    color: theme.colors.muted
  },
  guestButton: {
    marginBottom: theme.spacing.sm
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.lg
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.subtext
  },
  linkButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs
  },
  linkButtonPressed: {
    opacity: 0.7
  },
  linkText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary
  }
});
