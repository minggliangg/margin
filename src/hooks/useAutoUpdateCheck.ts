import { useEffect } from 'react'
import { checkForUpdate } from '../lib/updateCheck'

/** Check on launch and whenever the app returns to the foreground (iOS resume). */
export function useAutoUpdateCheck() {
  useEffect(() => {
    void checkForUpdate()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void checkForUpdate()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
}
