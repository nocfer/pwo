/**
 * useNetworkStatus - Reactive online/offline status via NetInfo
 *
 * Single low-level wrapper around @react-native-community/netinfo. The app's
 * source of truth for connectivity lives in DataContext (which subscribes once
 * via this hook); most UI should read `state.isOnline` from the context.
 */

import NetInfo from '@react-native-community/netinfo'
import { useEffect, useState } from 'react'

/** Treat "connected with reachable internet" as online; unknown counts as online. */
function deriveOnline(
  isConnected: boolean | null,
  isInternetReachable: boolean | null
): boolean {
  if (isConnected === false) return false
  // isInternetReachable is null while undetermined — don't flap to offline on it.
  if (isInternetReachable === false) return false
  return true
}

export function useNetworkStatus(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(deriveOnline(state.isConnected, state.isInternetReachable))
    })

    // Prime with the current state so we don't wait for the first change.
    NetInfo.fetch().then(state => {
      setIsOnline(deriveOnline(state.isConnected, state.isInternetReachable))
    })

    return () => unsubscribe()
  }, [])

  return { isOnline }
}

export default useNetworkStatus
