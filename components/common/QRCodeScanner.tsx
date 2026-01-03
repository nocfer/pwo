/**
 * QRCodeScanner - Camera-based QR code scanner component
 */

import { theme } from "@/theme/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Camera, CameraView } from "expo-camera";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onScan: (data: string) => void;
  onClose?: () => void;
};

export default function QRCodeScanner({ onScan, onClose }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Reset scanned state when component remounts
  useEffect(() => {
    setScanned(false);
  }, []);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission...</Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons
            name="camera-outline"
            size={64}
            color={theme.colors.muted}
          />
          <Text style={styles.message}>Camera permission is required</Text>
          <Text style={styles.submessage}>
            Please enable camera access in your device settings to scan QR codes
          </Text>
          {onClose && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
            >
              <Text style={styles.buttonText}>Go Back</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"]
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          {onClose && (
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed
              ]}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </Pressable>
          )}
        </View>
        <View style={styles.scannerArea}>
          <View style={styles.scannerFrame} />
        </View>
        <View style={styles.bottomBar}>
          <Text style={styles.instruction}>
            Position the QR code within the frame
          </Text>
          {scanned && <Text style={styles.scannedText}>QR code scanned!</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
    gap: theme.spacing.md
  },
  message: {
    ...theme.typography.h3,
    color: theme.colors.text,
    textAlign: "center"
  },
  submessage: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: "center",
    marginTop: theme.spacing.sm
  },
  button: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    ...theme.shadows.md
  },
  buttonPressed: {
    opacity: 0.9
  },
  buttonText: {
    ...theme.typography.bodyBold,
    color: theme.colors.primaryTextOn
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between"
  },
  topBar: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: "rgba(0, 0, 0, 0.5)"
  },
  closeButton: {
    alignSelf: "flex-start",
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    ...theme.shadows.md
  },
  closeButtonPressed: {
    opacity: 0.8
  },
  scannerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    backgroundColor: "transparent"
  },
  bottomBar: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    gap: theme.spacing.sm
  },
  instruction: {
    ...theme.typography.body,
    color: theme.colors.primaryTextOn,
    textAlign: "center"
  },
  scannedText: {
    ...theme.typography.bodyBold,
    color: theme.colors.success,
    textAlign: "center"
  }
});
