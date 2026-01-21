import {
  daysBetween,
  formatDate,
  getMondayBasedDayIndex,
  getWeekStart,
  isSameWeek,
  normalizeStreak
} from '@/lib/utils/date'
import { describe, expect, it } from 'vitest'

describe('daysBetween', () => {
  it('returns 0 for same day', () => {
    const date = new Date('2024-01-15')
    expect(daysBetween(date, date)).toBe(0)
  })

  it('returns correct days for future date', () => {
    const a = new Date('2024-01-15')
    const b = new Date('2024-01-18')
    expect(daysBetween(a, b)).toBe(3)
  })

  it('returns negative for past date', () => {
    const a = new Date('2024-01-18')
    const b = new Date('2024-01-15')
    expect(daysBetween(a, b)).toBe(-3)
  })

  it('handles month boundaries', () => {
    const a = new Date('2024-01-30')
    const b = new Date('2024-02-02')
    expect(daysBetween(a, b)).toBe(3)
  })

  it('handles year boundaries', () => {
    const a = new Date('2023-12-30')
    const b = new Date('2024-01-02')
    expect(daysBetween(a, b)).toBe(3)
  })

  it('ignores time portion', () => {
    const a = new Date('2024-01-15T08:00:00')
    const b = new Date('2024-01-15T22:00:00')
    expect(daysBetween(a, b)).toBe(0)
  })
})

describe('getMondayBasedDayIndex', () => {
  it('returns 0 for Monday', () => {
    // Jan 15, 2024 is a Monday
    expect(getMondayBasedDayIndex(new Date(2024, 0, 15))).toBe(0)
  })

  it('returns 6 for Sunday', () => {
    // Jan 14, 2024 is a Sunday
    expect(getMondayBasedDayIndex(new Date(2024, 0, 14))).toBe(6)
  })

  it('returns 2 for Wednesday', () => {
    // Jan 17, 2024 is a Wednesday
    expect(getMondayBasedDayIndex(new Date(2024, 0, 17))).toBe(2)
  })

  it('returns 4 for Friday', () => {
    // Jan 19, 2024 is a Friday
    expect(getMondayBasedDayIndex(new Date(2024, 0, 19))).toBe(4)
  })
})

describe('getWeekStart', () => {
  it('returns Monday for a Wednesday', () => {
    // 2024-01-17 (Wed) -> week starts 2024-01-15 (Mon)
    const result = getWeekStart(new Date(2024, 0, 17)) // Jan 17, 2024 (Wed)
    expect(result.getFullYear()).toBe(2024)
    expect(result.getMonth()).toBe(0) // January
    expect(result.getDate()).toBe(15) // 15th (Monday)
  })

  it('returns same day for Monday', () => {
    const result = getWeekStart(new Date(2024, 0, 15)) // Jan 15, 2024 (Mon)
    expect(result.getDate()).toBe(15)
  })

  it('returns previous Monday for Sunday', () => {
    // 2024-01-14 (Sun) -> week starts 2024-01-08 (Mon)
    const result = getWeekStart(new Date(2024, 0, 14)) // Jan 14, 2024 (Sun)
    expect(result.getDate()).toBe(8)
  })
})

describe('isSameWeek', () => {
  it('returns true for same week (Mon-Sun)', () => {
    const mon = new Date(2024, 0, 15) // Monday
    const fri = new Date(2024, 0, 19) // Friday same week
    expect(isSameWeek(mon, fri)).toBe(true)
  })

  it('returns true for Monday and Sunday of same week', () => {
    const mon = new Date(2024, 0, 15) // Monday
    const sun = new Date(2024, 0, 21) // Sunday same week
    expect(isSameWeek(mon, sun)).toBe(true)
  })

  it('returns false for different weeks', () => {
    const week1 = new Date(2024, 0, 15) // Monday week 1
    const week2 = new Date(2024, 0, 22) // Monday week 2
    expect(isSameWeek(week1, week2)).toBe(false)
  })

  it('returns false for Sunday and next Monday', () => {
    const sun = new Date(2024, 0, 21) // Sunday
    const mon = new Date(2024, 0, 22) // Monday next week
    expect(isSameWeek(sun, mon)).toBe(false)
  })
})

describe('normalizeStreak', () => {
  it('returns existing streak when same week', () => {
    const streak = [1, 0, 1, 1, 0, 1, 1]
    const lastDate = new Date(2024, 0, 15) // Monday
    const today = new Date(2024, 0, 17) // Wednesday same week
    const result = normalizeStreak(streak, lastDate, today)
    expect(result).toEqual([1, 0, 1, 1, 0, 1, 1])
  })

  it('resets streak when different week', () => {
    const streak = [1, 0, 1, 1, 0, 1, 1]
    const lastDate = new Date(2024, 0, 15) // Monday week 1
    const today = new Date(2024, 0, 22) // Monday week 2
    const result = normalizeStreak(streak, lastDate, today)
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0])
  })

  it('pads short streak to 7 entries', () => {
    const streak = [1, 0, 1]
    const lastDate = new Date(2024, 0, 15)
    const today = new Date(2024, 0, 17)
    const result = normalizeStreak(streak, lastDate, today)
    expect(result).toEqual([0, 0, 0, 0, 1, 0, 1])
  })

  it('handles streak longer than 7 by slicing last 7 entries', () => {
    const streak = [1, 0, 1, 1, 0, 1, 1, 0, 1]
    const lastDate = new Date(2024, 0, 15)
    const today = new Date(2024, 0, 17)
    const result = normalizeStreak(streak, lastDate, today)
    // slice(-7) gets last 7: [1, 1, 0, 1, 1, 0, 1]
    expect(result).toEqual([1, 1, 0, 1, 1, 0, 1])
  })

  it('resets when week changes even if only 1 day apart', () => {
    const streak = [1, 1, 1, 1, 1, 1, 1]
    const lastDate = new Date(2024, 0, 21) // Sunday
    const today = new Date(2024, 0, 22) // Monday next week
    const result = normalizeStreak(streak, lastDate, today)
    expect(result).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
})

describe('formatDate', () => {
  it('formats Date object to YYYY-MM-DD', () => {
    const date = new Date('2024-03-15T12:00:00Z')
    expect(formatDate(date)).toBe('2024-03-15')
  })

  it('formats string date to YYYY-MM-DD', () => {
    expect(formatDate('2024-03-15T12:00:00Z')).toBe('2024-03-15')
  })

  it('handles ISO string input', () => {
    expect(formatDate('2024-06-20T00:00:00.000Z')).toBe('2024-06-20')
  })
})
