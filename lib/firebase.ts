/**
 * Firebase Configuration and Initialization
 *
 * Initialize Firebase app and authentication with proper persistence
 * for React Native using the Firebase JS SDK.
 */

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

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

// Initialize Auth
const auth: Auth = getAuth(app)

export { app, auth }
export default app
