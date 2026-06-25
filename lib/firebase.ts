/**
 * Firebase Configuration and Initialization
 *
 * Initialize Firebase app and authentication with proper persistence
 * for React Native using the Firebase JS SDK.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence
} from 'firebase/auth'
import { Platform } from 'react-native'

// Firebase configuration from environment variables
// Expo requires EXPO_PUBLIC_ prefix for client-side access
function normalizeEnvValue(value?: string) {
  if (!value) return ''
  const trimmed = value.trim()
  let decoded = trimmed
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    decoded = trimmed
  }
  return decoded.replace(/^"+|"+$/g, '')
}

const firebaseConfig = {
  apiKey: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
  authDomain: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: normalizeEnvValue(
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  ),
  messagingSenderId: normalizeEnvValue(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: normalizeEnvValue(process.env.EXPO_PUBLIC_FIREBASE_APP_ID)
}

// Log Firebase config status (for debugging)
if (process.env.NODE_ENV === 'development') {
  const configStatus = Object.entries(firebaseConfig).map(([key, value]) => ({
    key,
    configured: Boolean(value)
  }))
  console.debug('Firebase config status:', configStatus)
}

// Validate that all required config values are present
const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId'
]

const missingKeys = requiredKeys.filter(
  key => !firebaseConfig[key] || firebaseConfig[key] === ''
)

if (missingKeys.length > 0) {
  console.warn(
    `Firebase configuration missing: ${missingKeys.join(', ')}. ` +
      'Please set EXPO_PUBLIC_FIREBASE_* environment variables in your .env file and restart Expo.'
  )
}

// Initialize Firebase app (only if not already initialized)
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Initialize Auth with persistence so login survives app restarts.
// Web uses the SDK's default (browser) persistence; native needs AsyncStorage
// via getReactNativePersistence — which ships only in firebase's react-native
// build (Metro resolves it at runtime, but tsc's default types don't expose
// it), hence the typed require rather than a top-level import.
let auth: Auth
if (Platform.OS === 'web') {
  auth = getAuth(app)
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth') as {
    getReactNativePersistence: (storage: unknown) => Persistence
  }
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    })
  } catch {
    // initializeAuth throws if auth was already initialized (e.g. Fast Refresh
    // re-running this module) — reuse the existing instance.
    auth = getAuth(app)
  }
}

export { app, auth }
export default app
