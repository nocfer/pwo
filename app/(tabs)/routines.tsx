import { RoutinesView } from "@/components";
import { haptics } from "@/lib/haptics";
import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RoutinesScreen() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.refresh();
    // Trigger a re-render of RoutinesView by changing the key
    setRefreshKey((prev) => prev + 1);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Routines</Text>
          <Text style={styles.subtitle}>Browse and start your workouts</Text>
        </View>

        <View
          style={[
            styles.searchContainer,
            isFocused && styles.searchContainerFocused,
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={isFocused ? theme.colors.primary : theme.colors.muted}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search routines..."
            placeholderTextColor={theme.colors.muted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.colors.muted}
              onPress={() => setQuery("")}
            />
          )}
        </View>

        <RoutinesView key={refreshKey} query={query} />
      </ScrollView>
    </SafeAreaView>
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
  header: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.muted,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  searchContainerFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
  },
});
