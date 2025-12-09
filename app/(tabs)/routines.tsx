import RoutinesView from "@/components/RoutinesView";
import { theme } from "@/theme/theme";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function RoutinesScreen() {
  const [query, setQuery] = useState("");
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>All routines</Text>
        <TextInput
          placeholder="Search routines"
          placeholderTextColor={theme.colors.muted}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
        <RoutinesView query={query} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  section: {
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: 20,
    marginBottom: theme.spacing.md,
  },
  search: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    marginBottom: theme.spacing.md,
  },
});
