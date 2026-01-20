import { theme } from "@/theme/theme";
import React, { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AuthLayout({ children, contentStyle }: Props) {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={StyleSheet.compose(
            styles.scrollContent,
            contentStyle
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  keyboardView: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg
  }
});

export default AuthLayout;
