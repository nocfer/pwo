import { describe, expect, it } from 'vitest'
import { STORAGE_KEYS } from '@/lib/storage-keys'

describe('STORAGE_KEYS', () => {
  it('all keys start with pwo: prefix', () => {
    const keys = Object.values(STORAGE_KEYS)
    keys.forEach(key => {
      expect(key.startsWith('pwo:')).toBe(true)
    })
  })

  it('defines WORKOUT_ACTIVE_STATE key', () => {
    expect(STORAGE_KEYS.WORKOUT_ACTIVE_STATE).toBe('pwo:workout:active-state')
  })

  it('defines WORKOUT_SYNC_QUEUE key', () => {
    expect(STORAGE_KEYS.WORKOUT_SYNC_QUEUE).toBe('pwo:workout:sync-queue')
  })

  it('defines WORKOUT_SESSION_ID key', () => {
    expect(STORAGE_KEYS.WORKOUT_SESSION_ID).toBe('pwo:workout:session-id')
  })

  it('all key values are unique', () => {
    const values = Object.values(STORAGE_KEYS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })
})
