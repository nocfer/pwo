/**
 * Authentication Context - Firebase Auth State Management
 *
 * Provides authentication state and methods for sign-in, sign-up,
 * guest access, and account linking.
 */

import { auth } from '@/lib/firebase'
import { haptics } from '@/lib/haptics'
import type { AuthError, User } from 'firebase/auth'
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword
} from 'firebase/auth'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

type AuthContextValue = {
  user: User | null
  loading: boolean
  error: string | null
  isAnonymous: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInAsGuest: () => Promise<void>
  linkAccount: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================================
// Helper Functions
// ============================================================================

function getAuthErrorMessage(error: AuthError | Error): string {
  // Check if it's a Firebase AuthError (has code property)
  if ('code' in error && typeof error.code === 'string') {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address'
      case 'auth/user-disabled':
        return 'This account has been disabled'
      case 'auth/user-not-found':
        return 'No account found with this email'
      case 'auth/wrong-password':
        return 'Incorrect password'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters'
      case 'auth/operation-not-allowed':
        return 'This sign-in method is not enabled'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection'
      case 'auth/credential-already-in-use':
        return 'This email is already linked to another account'
      default:
        return error.message || 'An error occurred. Please try again'
    }
  }
  // Regular Error - just return the message
  return error.message || 'An error occurred. Please try again'
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      currentUser => {
        setUser(currentUser)
        setLoading(false)
        setError(null)
      },
      authError => {
        setError(getAuthErrorMessage(authError))
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const runAuthAction = useCallback(async (action: () => Promise<void>) => {
    try {
      setError(null)
      setLoading(true)
      haptics.buttonTap()
      await action()
      haptics.formSave()
    } catch (err) {
      const errorMessage = getAuthErrorMessage(
        err instanceof Error ? err : (err as AuthError)
      )
      setError(errorMessage)
      setLoading(false)
      haptics.formValidationError()
      throw new Error(errorMessage)
    }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      await runAuthAction(async () => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail || !password) {
          throw new Error('Email and password are required')
        }

        await signInWithEmailAndPassword(auth, trimmedEmail, password)
      })
    },
    [runAuthAction]
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      await runAuthAction(async () => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail || !password) {
          throw new Error('Email and password are required')
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        await createUserWithEmailAndPassword(auth, trimmedEmail, password)
      })
    },
    [runAuthAction]
  )

  const signInAsGuest = useCallback(async () => {
    await runAuthAction(async () => {
      await signInAnonymously(auth)
    })
  }, [runAuthAction])

  const linkAccount = useCallback(
    async (email: string, password: string) => {
      if (!user || !user.isAnonymous) {
        const errorMessage = 'Only guest accounts can be linked'
        setError(errorMessage)
        setLoading(false)
        haptics.formValidationError()
        throw new Error(errorMessage)
      }

      await runAuthAction(async () => {
        const trimmedEmail = email.trim()
        if (!trimmedEmail || !password) {
          throw new Error('Email and password are required')
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        const credential = EmailAuthProvider.credential(trimmedEmail, password)
        await linkWithCredential(user, credential)
      })
    },
    [runAuthAction, user]
  )

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setError(null)
      haptics.buttonTap()
      await firebaseSignOut(auth)
    } catch (err) {
      const errorMessage = getAuthErrorMessage(err as AuthError)
      setError(errorMessage)
      haptics.formValidationError()
      throw new Error(errorMessage)
    }
  }, [])

  const contextValue: AuthContextValue = {
    user,
    loading,
    error,
    isAnonymous: user?.isAnonymous ?? false,
    signIn,
    signUp,
    signInAsGuest,
    linkAccount,
    signOut
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
