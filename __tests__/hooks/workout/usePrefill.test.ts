import { describe, expect, it, vi, beforeEach } from 'vitest'

import useAsyncData from '@/hooks/useAsyncData'
import { fetchPrefillData } from '@/lib/api'
import { usePrefill } from '@/hooks/workout/usePrefill'

vi.mock('react', () => ({
  useMemo: vi.fn((fn: () => unknown) => fn())
}))

vi.mock('@/lib/api', () => ({
  fetchPrefillData: vi.fn()
}))

vi.mock('@/hooks/useAsyncData', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    data: null,
    loading: false,
    error: null,
    refetch: vi.fn()
  }))
}))

const mockUseAsyncData = useAsyncData as ReturnType<typeof vi.fn>
const mockFetch = fetchPrefillData as ReturnType<typeof vi.fn>

describe('usePrefill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAsyncData.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: vi.fn()
    })
  })

  it('returns empty map when loading', () => {
    mockUseAsyncData.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: vi.fn()
    })

    const result = usePrefill(['ex-1', 'ex-2'])

    expect(result.isLoading).toBe(true)
    expect(result.prefillMap.size).toBe(0)
  })

  it('builds map from API response data', () => {
    mockUseAsyncData.mockReturnValue({
      data: [
        { exerciseId: 'ex-1', reps: 8, weight: 185 },
        { exerciseId: 'ex-2', reps: 12, weight: 70 }
      ],
      loading: false,
      error: null,
      refetch: vi.fn()
    })

    const result = usePrefill(['ex-1', 'ex-2'])

    expect(result.isLoading).toBe(false)
    expect(result.prefillMap.size).toBe(2)
    expect(result.prefillMap.get('ex-1')).toEqual({ reps: 8, weight: 185 })
    expect(result.prefillMap.get('ex-2')).toEqual({ reps: 12, weight: 70 })
  })

  it('returns empty map when API returns empty array', () => {
    mockUseAsyncData.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refetch: vi.fn()
    })

    const result = usePrefill(['ex-1'])

    expect(result.prefillMap.size).toBe(0)
    expect(result.error).toBeNull()
  })

  it('returns empty map on API failure', () => {
    mockUseAsyncData.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Network error'),
      refetch: vi.fn()
    })

    const result = usePrefill(['ex-1'])

    expect(result.prefillMap.size).toBe(0)
    expect(result.error).toBeInstanceOf(Error)
  })

  it('passes skip=true when exerciseIds is empty', () => {
    usePrefill([])

    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Array),
      { skip: true }
    )
  })

  it('passes skip=false when exerciseIds are provided', () => {
    usePrefill(['ex-1'])

    expect(mockUseAsyncData).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Array),
      { skip: false }
    )
  })

  it('creates the fetcher that calls fetchPrefillData', () => {
    usePrefill(['ex-1', 'ex-2'])

    const fetcherFn = mockUseAsyncData.mock.calls[0][0]
    fetcherFn()

    expect(mockFetch).toHaveBeenCalledWith(['ex-1', 'ex-2'])
  })
})
