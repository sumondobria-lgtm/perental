'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { LocationMap } from '@/components/location-map'
import { LocationHistoryList } from '@/components/location-history-list'
import { ContactsTable } from '@/components/contacts-table'
import { CallLogsTable } from '@/components/call-logs-table'
import { ScreenshotGallery } from '@/components/screenshot-gallery'
import { AppUsageChart } from '@/components/app-usage-chart'

interface Device {
  id: string
  device_name: string
  pairing_code: string
}

interface CurrentLocation {
  latitude: number
  longitude: number
  address: string
  timestamp: string
}

export default function ChildTrackingPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = params.deviceId as string
  
  const [device, setDevice] = useState<Device | null>(null)
  const [location, setLocation] = useState<CurrentLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('location')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false)
  const [screenshotStatus, setScreenshotStatus] = useState<string | null>(null)

  const supabase = createClient()

  // Load dark mode preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved) {
        setIsDarkMode(JSON.parse(saved))
      }
    }
  }, [])

  // Apply dark mode class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [isDarkMode])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch device details
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('*')
          .eq('id', deviceId)
          .eq('user_id', user.id)
          .single()

        if (deviceError || !deviceData) {
          setError('Device not found')
          return
        }

        setDevice(deviceData)

        // Fetch current location
        try {
          const response = await fetch(`/api/location?deviceId=${deviceId}`)
          
          if (response.ok) {
            const locationData = await response.json()
            setLocation(locationData)
            setLastUpdated(new Date(locationData.timestamp))
          } else {
            setError('No location data available yet')
          }
        } catch (err) {
          console.error('[v0] Location fetch error:', err)
          setError('Failed to load location data')
        }

        setLoading(false)
      } catch (err) {
        console.error('[v0] Data fetch error:', err)
        setError('Failed to load device information')
        setLoading(false)
      }
    }

    fetchData()

    // Refresh location every 10 seconds
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [deviceId, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading device information...</p>
      </div>
    )
  }

  const requestScreenshot = async () => {
    setIsCapturingScreenshot(true)
    setScreenshotStatus(null)
    try {
      const response = await fetch('/api/screenshot-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId })
      })

      if (response.ok) {
        setScreenshotStatus('Screenshot command sent. Waiting for device...')
        // Wait for 30 seconds to see if we get a response
        setTimeout(() => {
          setScreenshotStatus(null)
        }, 30000)
      } else {
        setScreenshotStatus('Failed to send screenshot command')
      }
    } catch (error) {
      setScreenshotStatus('Error sending screenshot command')
      console.error('Screenshot error:', error)
    } finally {
      setIsCapturingScreenshot(false)
    }
  }

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', newMode.toString())
    }
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error || 'Device not found'}</p>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="mt-4"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background p-6 ${isDarkMode ? 'dark' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
            >
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={requestScreenshot}
                disabled={isCapturingScreenshot}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCapturingScreenshot ? 'Requesting...' : 'Take Screenshot'}
              </Button>
              <Button
                onClick={toggleDarkMode}
                variant="outline"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </Button>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {device.device_name}
          </h1>
          <p className="text-muted-foreground mt-1">Device monitoring dashboard</p>
          {screenshotStatus && (
            <p className="text-sm text-blue-600 mt-2">{screenshotStatus}</p>
          )}
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Device Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pairing Code</span>
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                {device.pairing_code}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Update</span>
              <span className="text-sm text-muted-foreground">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'No data yet'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Location, Screenshots, App Usage, Contacts, Call Logs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
            <TabsTrigger value="app-usage">App Usage</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="call-logs">Call Logs</TabsTrigger>
          </TabsList>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            {location ? (
              <div className="grid grid-cols-10 gap-6 h-[600px]">
                {/* Map - 70% width */}
                <div className="col-span-7">
                  <LocationMap
                    latitude={location.latitude}
                    longitude={location.longitude}
                    deviceName={device.device_name}
                    address={location.address}
                    timestamp={location.timestamp}
                  />
                </div>

                {/* History - 30% width */}
                <div className="col-span-3">
                  <LocationHistoryList deviceId={deviceId} />
                </div>
              </div>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <p className="text-amber-800">{error || 'Waiting for location data...'}</p>
                  <p className="text-sm text-amber-700 mt-2">
                    The device must start sharing location first. Send the pairing code to the child.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Screenshots Tab */}
          <TabsContent value="screenshots" className="space-y-6">
            <ScreenshotGallery deviceId={deviceId} />
          </TabsContent>

          {/* App Usage Tab */}
          <TabsContent value="app-usage" className="space-y-6">
            <AppUsageChart deviceId={deviceId} />
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactsTable deviceId={deviceId} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Logs Tab */}
          <TabsContent value="call-logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Call Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <CallLogsTable deviceId={deviceId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
