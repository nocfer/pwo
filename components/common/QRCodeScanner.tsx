/**
 * QRCodeScanner - Camera-based QR code scanner with lime framing brackets and
 * an animated scan line.
 */

import { theme } from '@/theme/theme'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Camera, CameraView } from 'expo-camera'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated'

type Props = {
  onScan: (data: string) => void
  onClose?: () => void
  onImportFile?: () => void
}

const FRAME_SIZE = 236
const SCAN_TRAVEL = FRAME_SIZE - 28

export default function QRCodeScanner({ onScan, onClose, onImportFile }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const scanY = useSharedValue(0)

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
    }
    getCameraPermissions()
  }, [])

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(SCAN_TRAVEL, {
        duration: 2600,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    )
    return () => cancelAnimation(scanY)
  }, [scanY])

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }]
  }))

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return
    setScanned(true)
    onScan(data)
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.message}>Requesting camera permission…</Text>
        </View>
      </View>
    )
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
          <Text style={styles.message}>Camera access is required</Text>
          <Text style={styles.submessage}>
            Please enable camera access in your device settings to scan QR codes
          </Text>
          {onImportFile && (
            <Pressable
              onPress={onImportFile}
              style={({ pressed }) => [
                styles.importButton,
                pressed && styles.importButtonPressed
              ]}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={theme.colors.text}
              />
              <Text style={styles.importButtonText}>Import from file</Text>
            </Pressable>
          )}
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
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
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
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          )}
        </View>

        <View style={styles.scannerArea}>
          <View style={styles.frame}>
            <View style={styles.frameTint} />
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {!scanned && (
              <Animated.View style={[styles.scanLine, scanLineStyle]} />
            )}
          </View>
        </View>

        <View style={styles.bottomBar}>
          {onImportFile && (
            <Pressable
              onPress={onImportFile}
              style={({ pressed }) => [
                styles.importButton,
                pressed && styles.importButtonPressed
              ]}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={theme.colors.text}
              />
              <Text style={styles.importButtonText}>Import from file</Text>
            </Pressable>
          )}
          {scanned ? (
            <Text style={styles.scannedText}>QR code scanned!</Text>
          ) : (
            <Text style={styles.hint}>Position the QR code within the frame</Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md
  },
  message: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center'
  },
  submessage: {
    ...theme.typography.body,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.sm
  },
  button: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg
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
    justifyContent: 'space-between'
  },
  topBar: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl
  },
  closeButton: {
    alignSelf: 'flex-start',
    width: 42,
    height: 42,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonPressed: {
    opacity: 0.8
  },
  scannerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE
  },
  frameTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.xl,
    opacity: 0.35
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: theme.colors.primary
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: theme.radius.xl
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: theme.radius.xl
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: theme.radius.xl
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: theme.radius.xl
  },
  scanLine: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    height: 2,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    boxShadow: `0 0 12px 2px ${theme.colors.primaryGlow}`
  },
  bottomBar: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    height: 50,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  importButtonPressed: {
    opacity: 0.8
  },
  importButtonText: {
    ...theme.typography.body,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.text
  },
  hint: {
    ...theme.typography.small,
    color: theme.colors.faint,
    textAlign: 'center'
  },
  scannedText: {
    ...theme.typography.bodyBold,
    color: theme.colors.success,
    textAlign: 'center'
  }
})
