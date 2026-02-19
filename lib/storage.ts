/**
 * Unified Storage Layer
 *
 * Single source of truth for all data persistence operations.
 * Works consistently across web (localStorage) and native (FileSystem).
 */

import type {
  ChallengeProgress,
  EventRecord,
  Exercise,
  HistoryEntry,
  HistoryFile,
  Program,
  ProgramProgress,
  ProgressHistory,
  SessionState,
  StreakEntry
} from '@/types'
import * as FileSystem from 'expo-file-system/legacy'
import { Platform } from 'react-native'
import { getMondayBasedDayIndex, normalizeStreak } from './utils/date'

// Re-export types for backwards compatibility
export type {
  EventRecord,
  HistoryEntry,
  HistoryFile,
  SessionState,
  StreakEntry
} from '@/types'

// ============================================================================
// Storage Keys
// ============================================================================

const KEYS = {
  SESSIONS: 'pwo.sessions',
  EVENTS: 'pwo.events',
  HISTORY: 'pwo.history',
  PROGRESS: 'pwo.progress',
  EXERCISES: 'pwo.exercises',
  PROGRAMS: 'pwo.programs',
  PROGRAM_PROGRESS: 'pwo.program_progress',
  CHALLENGE_PROGRESS: 'pwo.challenge_progress',
  PROGRESS_HISTORY: 'pwo.progress_history'
} as const

// ============================================================================
// Platform-specific helpers
// ============================================================================

const isWeb = Platform.OS === 'web'
type FileSystemType = typeof FileSystem & {
  documentDirectory?: string
  cacheDirectory?: string
}
const FS = FileSystem as FileSystemType
const DOC_DIR: string = FS.documentDirectory || FS.cacheDirectory || ''

function getFilePath(key: string): string {
  return `${DOC_DIR}${key}.json`
}

// Web storage helpers
function webRead<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

function webWrite<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage might be full or disabled
  }
}

// Native storage helpers
async function nativeRead<T>(key: string, defaultValue: T): Promise<T> {
  const path = getFilePath(key)
  try {
    const info = await FileSystem.getInfoAsync(path)
    if (!info.exists) return defaultValue
    const raw = await FileSystem.readAsStringAsync(path)
    return raw ? (JSON.parse(raw) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

async function nativeWrite<T>(key: string, value: T): Promise<void> {
  const path = getFilePath(key)
  try {
    await FileSystem.writeAsStringAsync(path, JSON.stringify(value, null, 2))
  } catch {
    // Best effort
  }
}

// Unified read/write
async function read<T>(key: string, defaultValue: T): Promise<T> {
  if (isWeb) {
    return webRead(key, defaultValue)
  }
  return nativeRead(key, defaultValue)
}

async function write<T>(key: string, value: T): Promise<void> {
  if (isWeb) {
    webWrite(key, value)
    return
  }
  await nativeWrite(key, value)
}

function generateId(prefix: string): string {
  // Prefer crypto.randomUUID if available (web)
  const crypto =
    typeof globalThis !== 'undefined'
      ? (globalThis as typeof globalThis & { crypto: Crypto })?.crypto
      : undefined
  const rand =
    typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${rand}`
}

// ============================================================================
// Storage API
// ============================================================================

export const storage = {
  // --------------------------------------------------------------------------
  // Exercises
  // --------------------------------------------------------------------------

  async loadExercises(): Promise<Exercise[]> {
    return read<Exercise[]>(KEYS.EXERCISES, [])
  },

  async saveExercises(exercises: Exercise[]): Promise<void> {
    await write(KEYS.EXERCISES, exercises)
  },

  async upsertExercise(
    input: Omit<Exercise, 'createdAt' | 'updatedAt'> &
      Partial<Pick<Exercise, 'createdAt' | 'updatedAt'>>
  ): Promise<Exercise> {
    const now = new Date().toISOString()
    const arr = await this.loadExercises()
    const id = input.id || generateId('ex')
    const idx = arr.findIndex(e => e.id === id)
    const createdAt = idx >= 0 ? arr[idx].createdAt : (input.createdAt ?? now)
    const next: Exercise = {
      id,
      name: input.name,
      category: input.category,
      icon: input.icon,
      source: input.source,
      createdAt,
      updatedAt: input.updatedAt ?? now
    }
    if (idx >= 0) arr[idx] = next
    else arr.push(next)
    await this.saveExercises(arr)
    return next
  },

  async deleteExercise(id: string): Promise<void> {
    const arr = await this.loadExercises()
    await this.saveExercises(arr.filter(e => e.id !== id))
  },

  // --------------------------------------------------------------------------
  // Programs
  // --------------------------------------------------------------------------

  async loadPrograms(): Promise<Program[]> {
    return read<Program[]>(KEYS.PROGRAMS, [])
  },

  async savePrograms(programs: Program[]): Promise<void> {
    await write(KEYS.PROGRAMS, programs)
  },

  async upsertProgram(
    input: Omit<Program, 'createdAt' | 'updatedAt'> &
      Partial<Pick<Program, 'createdAt' | 'updatedAt'>>
  ): Promise<Program> {
    const now = new Date().toISOString()
    const arr = await this.loadPrograms()
    const id = input.id || generateId('prg')
    const idx = arr.findIndex(p => p.id === id)
    const createdAt = idx >= 0 ? arr[idx].createdAt : (input.createdAt ?? now)
    const next: Program = {
      id,
      name: input.name,
      description: input.description,
      blocks: input.blocks,
      challengeConfig: input.challengeConfig,
      source: input.source,
      createdAt,
      updatedAt: input.updatedAt ?? now,
      // Include new configuration fields for sets and rest timers
      initialWarmup: input.initialWarmup,
      defaultRestBetweenExercises: input.defaultRestBetweenExercises
    }
    if (idx >= 0) arr[idx] = next
    else arr.push(next)
    await this.savePrograms(arr)
    return next
  },

  async deleteProgram(id: string): Promise<void> {
    const arr = await this.loadPrograms()
    await this.savePrograms(arr.filter(p => p.id !== id))
  },

  // --------------------------------------------------------------------------
  // Session State
  // --------------------------------------------------------------------------

  async loadSessionState(
    slug: string,
    sessionIndex: number
  ): Promise<SessionState | null> {
    const arr = await read<SessionState[]>(KEYS.SESSIONS, [])
    return (
      arr.find(s => s.slug === slug && s.sessionIndex === sessionIndex) || null
    )
  },

  async saveSessionState(state: SessionState): Promise<void> {
    const arr = await read<SessionState[]>(KEYS.SESSIONS, [])
    const idx = arr.findIndex(
      s => s.slug === state.slug && s.sessionIndex === state.sessionIndex
    )
    if (idx >= 0) {
      arr[idx] = state
    } else {
      arr.push(state)
    }
    await write(KEYS.SESSIONS, arr)
  },

  async clearSessionState(slug: string, sessionIndex: number): Promise<void> {
    const arr = await read<SessionState[]>(KEYS.SESSIONS, [])
    const filtered = arr.filter(
      s => !(s.slug === slug && s.sessionIndex === sessionIndex)
    )
    await write(KEYS.SESSIONS, filtered)
  },

  // --------------------------------------------------------------------------
  // Events
  // --------------------------------------------------------------------------

  async loadEvents(): Promise<EventRecord[]> {
    return read<EventRecord[]>(KEYS.EVENTS, [])
  },

  async loadEventsForSlug(slug: string): Promise<EventRecord[]> {
    const events = await this.loadEvents()
    return events.filter(e => e.slug === slug)
  },

  async appendEvent(
    event: Omit<EventRecord, 'ts'> & { ts?: string }
  ): Promise<void> {
    const arr = await read<EventRecord[]>(KEYS.EVENTS, [])
    const record: EventRecord = {
      ...event,
      ts: event.ts ?? new Date().toISOString()
    }
    arr.push(record)
    await write(KEYS.EVENTS, arr)
  },

  // --------------------------------------------------------------------------
  // History
  // --------------------------------------------------------------------------

  async loadAllHistory(): Promise<HistoryFile> {
    return read<HistoryFile>(KEYS.HISTORY, [])
  },

  async loadHistory(slug: string): Promise<HistoryEntry[]> {
    const arr = await read<HistoryFile>(KEYS.HISTORY, [])
    const entry = arr.find(h => h.slug === slug)
    return entry?.recent ?? []
  },

  async appendHistory(slug: string, entry: HistoryEntry): Promise<void> {
    const arr = await read<HistoryFile>(KEYS.HISTORY, [])
    const idx = arr.findIndex(h => h.slug === slug)
    if (idx >= 0) {
      arr[idx].recent.unshift(entry)
    } else {
      arr.push({ slug, recent: [entry] })
    }
    await write(KEYS.HISTORY, arr)
  },

  // --------------------------------------------------------------------------
  // Progress / Streak (Calendar Week Aligned: Mon=0, Sun=6)
  // --------------------------------------------------------------------------

  async loadStreak(slug: string): Promise<number[] | null> {
    const arr = await read<StreakEntry[]>(KEYS.PROGRESS, [])
    const entry = arr.find(e => e.slug === slug)
    if (!entry) return null

    // Normalize for calendar week - resets if different week
    const today = new Date()
    const last = new Date(entry.updatedAt)
    return normalizeStreak(entry.streak, last, today)
  },

  async saveStreakHit(slug: string, dateISO: string): Promise<void> {
    const arr = await read<StreakEntry[]>(KEYS.PROGRESS, [])
    const idx = arr.findIndex(e => e.slug === slug)
    const today = new Date(dateISO)
    const dayIndex = getMondayBasedDayIndex(today) // 0=Mon, 6=Sun

    if (idx < 0) {
      // New entry: create fresh week and mark today's day
      const streak = Array(7).fill(0)
      streak[dayIndex] = 1
      arr.push({ slug, streak, updatedAt: today.toISOString() })
    } else {
      const entry = arr[idx]
      const last = new Date(entry.updatedAt)
      // Normalize streak (resets if new week)
      const normalized = normalizeStreak(entry.streak, last, today)
      // Set today's day-of-week to 1
      normalized[dayIndex] = 1
      arr[idx] = { slug, streak: normalized, updatedAt: today.toISOString() }
    }
    await write(KEYS.PROGRESS, arr)
  },

  async loadAllStreaks(): Promise<StreakEntry[]> {
    return read<StreakEntry[]>(KEYS.PROGRESS, [])
  },

  // --------------------------------------------------------------------------
  // Completed Sessions
  // --------------------------------------------------------------------------

  async loadCompletedSessions(slug: string): Promise<Set<number>> {
    const completed = new Set<number>()

    // From events
    const events = await this.loadEvents()
    for (const e of events) {
      if (e.slug === slug && e.type === 'session_completed') {
        completed.add(e.sessionIndex)
      }
    }

    // From storage history
    const storageHistory = await this.loadHistory(slug)
    for (const h of storageHistory) {
      if (h.sessionIndex != null) completed.add(h.sessionIndex)
    }

    return completed
  },

  async getLastCompletedSlug(): Promise<string | null> {
    const events = await this.loadEvents()
    const last = [...events].reverse().find(e => e.type === 'session_completed')
    return last?.slug ?? null
  },

  // --------------------------------------------------------------------------
  // Program Progress
  // --------------------------------------------------------------------------

  async loadProgramProgress(
    programId: string
  ): Promise<ProgramProgress | null> {
    const arr = await read<ProgramProgress[]>(KEYS.PROGRAM_PROGRESS, [])
    const match = arr.find(p => p.programId === programId) ?? null
    return match
  },

  async loadAllProgramProgress(): Promise<ProgramProgress[]> {
    const arr = await read<ProgramProgress[]>(KEYS.PROGRAM_PROGRESS, [])
    return arr
  },

  // --------------------------------------------------------------------------
  // Challenge Progress
  // --------------------------------------------------------------------------

  async loadChallengeProgress(
    challengeId: string
  ): Promise<ChallengeProgress | null> {
    const arr = await read<ChallengeProgress[]>(KEYS.CHALLENGE_PROGRESS, [])
    return arr.find(c => c.challengeId === challengeId) ?? null
  },

  async loadAllChallengeProgress(): Promise<ChallengeProgress[]> {
    return read<ChallengeProgress[]>(KEYS.CHALLENGE_PROGRESS, [])
  },

  // --------------------------------------------------------------------------
  // Progress History
  // --------------------------------------------------------------------------

  async appendProgressHistory(entry: ProgressHistory[number]): Promise<void> {
    const history = await read<ProgressHistory>(KEYS.PROGRESS_HISTORY, [])
    history.push(entry)
    // Keep only last 365 days of history
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 365)
    const filtered = history.filter(e => new Date(e.date) >= cutoff)
    await write(KEYS.PROGRESS_HISTORY, filtered)
  },

  async getProgressHistory(
    programId?: string,
    challengeId?: string,
    days: number = 30
  ): Promise<ProgressHistory> {
    const history = await read<ProgressHistory>(KEYS.PROGRESS_HISTORY, [])
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    return history.filter(entry => {
      if (new Date(entry.date) < cutoff) return false
      if (programId && entry.programId === programId) return true
      if (challengeId && entry.challengeId === challengeId) return true
      if (!programId && !challengeId) return true
      return false
    })
  },

  // --------------------------------------------------------------------------
  // Data Management
  // --------------------------------------------------------------------------

  /**
   * Clear all user data (progress, history, etc.)
   * Does NOT clear exercises and programs (library data)
   */
  async clearAllProgressData(): Promise<void> {
    await Promise.all([
      write(KEYS.SESSIONS, []),
      write(KEYS.EVENTS, []),
      write(KEYS.HISTORY, []),
      write(KEYS.PROGRESS, []),
      write(KEYS.PROGRAM_PROGRESS, []),
      write(KEYS.CHALLENGE_PROGRESS, []),
      write(KEYS.PROGRESS_HISTORY, [])
    ])
  },

  /**
   * Clear ALL data including library (exercises and programs)
   * Use with caution - this is a full reset
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      write(KEYS.SESSIONS, []),
      write(KEYS.EVENTS, []),
      write(KEYS.HISTORY, []),
      write(KEYS.PROGRESS, []),
      write(KEYS.EXERCISES, []),
      write(KEYS.PROGRAMS, []),
      write(KEYS.PROGRAM_PROGRESS, []),
      write(KEYS.CHALLENGE_PROGRESS, []),
      write(KEYS.PROGRESS_HISTORY, [])
    ])
  },

  // --------------------------------------------------------------------------
  // Generic storage methods for audit logging
  // --------------------------------------------------------------------------

  async getItem(key: string): Promise<string | null> {
    try {
      return await read<string | null>(key, null)
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await write(key, value)
  }
}

export default storage
