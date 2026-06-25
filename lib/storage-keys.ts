export const STORAGE_KEYS = {
  WORKOUT_ACTIVE_STATE: 'pwo:workout:active-state',
  WORKOUT_SYNC_QUEUE: 'pwo:workout:sync-queue',
  WORKOUT_SESSION_ID: 'pwo:workout:session-id',
  /** Offline write queue for exercise/program mutations (see lib/syncQueue) */
  DATA_SYNC_QUEUE: 'pwo:data:sync-queue'
} as const
