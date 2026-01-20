/**
 * Sign Up Screen
 *
 * Allows users to create a new account with email and password
 */

import AuthErrorBanner from "@/components/auth/AuthErrorBanner";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/common/Button";
import { useAuth } from "@/context/AuthContext";
import haptics from "@/lib/haptics";
import { theme } from "@/theme/theme";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignUpScreen() {
  const { signUp, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignUp = async () => {
    // Validation
    if (!email.trim() || !password || !confirmPassword) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      setLocalError(null);
      await signUp(email, password);
      // Navigation will happen automatically via auth state change
    } catch (err) {}
  };

  const navigateToSignIn = () => {
    haptics.buttonTap();
    router.back();
  };

  const isLoading = loading;
  const formError = localError ?? error;

  return (
    <AuthLayout>
      <AuthHeader
        title="Create Account"
        subtitle="Sign up to start tracking your progress"
        iconName="person-add"
        showBackButton
        onBack={navigateToSignIn}
      />

      <View style={styles.form}>
        <AuthErrorBanner message={formError} />

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
            placeholder="At least 6 characters"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            editable={!isLoading}
          />
        </View>

        <Button
          label={isLoading ? "Creating account..." : "Create Account"}
          variant="primary"
          size="lg"
          onPress={handleSignUp}
          disabled={
            isLoading ||
            !email.trim() ||
            !password ||
            !confirmPassword ||
            password !== confirmPassword
          }
          fullWidth
          style={styles.signUpButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable
            onPress={navigateToSignIn}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.linkButton,
              pressed && styles.linkButtonPressed
            ]}
          >
            <Text style={styles.linkText}>Sign In</Text>
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
  signUpButton: {
    marginTop: theme.spacing.sm
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
