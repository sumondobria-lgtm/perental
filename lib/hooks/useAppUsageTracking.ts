'use client'

import { useEffect, useRef } from 'react'

export interface AppUsageData {
  appName: string
  packageName?: string
  usageSeconds: number
  lastOpened: string
  sessionCount: number
}

export function useAppUsageTracking(deviceId: string) {
  const trackingRef = useRef<NodeJS.Timeout | null>(null)
  const appUsageRef = useRef<Map<string, AppUsageData>>(new Map())

  // Mock app tracking - in real scenario would use Android bridge
  const trackAppUsage = () => {
    // For web, we track the document title/focused app
    // In Android WebView, this would use AccessibilityService or ActivityManager

    // Mock data for demonstration
    const mockApps: AppUsageData[] = [
      {
        appName: 'Chrome',
        packageName: 'com.android.chrome',
        usageSeconds: Math.floor(Math.random() * 3600),
        lastOpened: new Date().toISOString(),
        sessionCount: Math.floor(Math.random() * 5) + 1
      },
      {
        appName: 'YouTube',
        packageName: 'com.google.android.youtube',
        usageSeconds: Math.floor(Math.random() * 1800),
        lastOpened: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        sessionCount: Math.floor(Math.random() * 3) + 1
      }
    ]

    return mockApps
  }

  const syncAppUsage = async (apps: AppUsageData[]) => {
    try {
      const response = await fetch('/api/app-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          apps
        })
      })

      if (!response.ok) {
        throw new Error('Failed to sync app usage')
      }

      return await response.json()
    } catch (error) {
      console.error('App usage sync error:', error)
      throw error
    }
  }

  useEffect(() => {
    // Start tracking - sync every 5 minutes
    trackingRef.current = setInterval(async () => {
      const appUsageData = trackAppUsage()
      await syncAppUsage(appUsageData)
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      if (trackingRef.current) {
        clearInterval(trackingRef.current)
      }
    }
  }, [deviceId])

  // Manually trigger sync for testing
  const manualSync = async () => {
    const appUsageData = trackAppUsage()
    return syncAppUsage(appUsageData)
  }

  return { manualSync }
}
