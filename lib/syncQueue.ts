/**
 * syncQueue - Persistent offline write queue
 *
 * Backs the offline-first layer: when an exercise/program mutation can't reach
 * the API (offline or a transient network failure), it's recorded here and
 * replayed in FIFO order on reconnect. Persisted in MMKV so a queued write
 * survives an app restart.
 */

import { storage } from '@/lib/mmkv'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { PendingMutation } from '@/types'

const KEY = STORAGE_KEYS.DATA_SYNC_QUEUE

/** Read the full queue (oldest first). Tolerates corrupt/missing data. */
export function loadQueue(): PendingMutation[] {
  try {
    const raw = storage.getString(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as PendingMutation[]) : []
  } catch {
    return []
  }
}

function saveQueue(queue: PendingMutation[]): void {
  storage.set(KEY, JSON.stringify(queue))
}

/** Append an entry and return the updated queue. */
export function enqueue(
  entry: Omit<PendingMutation, 'id' | 'createdAt' | 'retryCount'>
): PendingMutation[] {
  const queue = loadQueue()
  const full: PendingMutation = {
    ...entry,
    id: `sq_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    createdAt: Date.now(),
    retryCount: 0
  }
  const next = [...queue, full]
  saveQueue(next)
  return next
}

/** Remove an entry by its queue id and return the updated queue. */
export function dequeue(id: string): PendingMutation[] {
  const next = loadQueue().filter(e => e.id !== id)
  saveQueue(next)
  return next
}

/** Merge a patch into an entry (e.g. bump retryCount) and return the queue. */
export function updateEntry(
  id: string,
  patch: Partial<PendingMutation>
): PendingMutation[] {
  const next = loadQueue().map(e => (e.id === id ? { ...e, ...patch } : e))
  saveQueue(next)
  return next
}

export function clearQueue(): void {
  storage.remove(KEY)
}

/** Set of entity ids that currently have a queued write (for pending dots). */
export function pendingEntityIds(queue: PendingMutation[]): Set<string> {
  return new Set(queue.map(e => e.entityId))
}
