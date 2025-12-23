/**
 * Alert utility functions for consistent error handling and confirmations
 */

import { Alert } from "react-native";

/**
 * Format an error into a user-friendly message
 */
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

/**
 * Show an error alert with consistent formatting
 */
export function showErrorAlert(title: string, error: unknown): void {
  Alert.alert(title, formatError(error));
}

/**
 * Show a delete confirmation dialog
 */
export function showDeleteConfirmation(
  itemType: "program" | "exercise",
  itemName: string,
  onConfirm: () => void
): void {
  const title = `Delete ${itemType}?`;
  const message = `Delete "${itemName}"? This can't be undone.`;

  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: onConfirm
    }
  ]);
}

