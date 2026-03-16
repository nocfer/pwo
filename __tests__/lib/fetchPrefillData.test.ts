import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.EXPO_PUBLIC_API_ENABLED = 'true'
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.api'
})

vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn(() => Promise.resolve('mock-token'))
    }
  }
}))

import { fetchPrefillData } from '@/lib/api'

describe('fetchPrefillData', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty array when exerciseIds is empty', async () => {
    const result = await fetchPrefillData([])
    expect(result).toEqual([])
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('constructs URL with comma-separated exerciseIds', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([{ exerciseId: 'ex-1', reps: 8, weight: 185 }])
    })

    await fetchPrefillData(['ex-1', 'ex-2'])

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.api/api/v1/exercises/prefill?exerciseIds=ex-1,ex-2',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-token'
        })
      })
    )
  })

  it('returns parsed response on success', async () => {
    const response = [
      { exerciseId: 'ex-1', reps: 8, weight: 185 },
      { exerciseId: 'ex-2', reps: 12, weight: 70 }
    ]
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response)
    })

    const result = await fetchPrefillData(['ex-1', 'ex-2'])
    expect(result).toEqual(response)
  })

  it('returns empty array on API error (graceful fallback)', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Not Found' })
    })

    const result = await fetchPrefillData(['ex-1'])
    expect(result).toEqual([])
  })

  it('returns empty array on network failure', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>
    mockFetch.mockRejectedValue(new TypeError('fetch failed'))

    const result = await fetchPrefillData(['ex-1', 'ex-2'])
    expect(result).toEqual([])
  })

  it('encodes exerciseIds in URL', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    })

    await fetchPrefillData(['ex with spaces', 'ex&special'])

    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.api/api/v1/exercises/prefill?exerciseIds=ex%20with%20spaces,ex%26special',
      expect.any(Object)
    )
  })
})
