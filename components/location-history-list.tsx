'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LocationRecord {
  id: string
  latitude: number
  longitude: number
  accuracy: number | null
  timestamp: string
  address: string
}

interface LocationHistoryListProps {
  deviceId: string
}

export function LocationHistoryList({ deviceId }: LocationHistoryListProps) {
  const [history, setHistory] = useState<LocationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/location-history?deviceId=${deviceId}&hours=24`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch location history')
        }

        const { data } = await response.json()
        setHistory(data)
        setError('')
      } catch (err) {
        console.error('[v0] History fetch error:', err)
        setError('Failed to load location history')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
    
    // Refresh history every 30 seconds
    const interval = setInterval(fetchHistory, 30000)
    return () => clearInterval(interval)
  }, [deviceId])

  if (error) {
    return (
      <Card className="h-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Location History (24h)</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">{history.length} locations</p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden px-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground text-center px-4">
              No location data available yet
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2 px-4">
              {history.map((record) => {
                const date = new Date(record.timestamp)
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })

                return (
                  <div
                    key={record.id}
                    className="p-2 bg-gray-50 rounded text-sm border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs text-gray-900 truncate">
                          {record.address}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeStr} • {dateStr}
                        </p>
                        {record.accuracy && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            ±{Math.round(record.accuracy)}m
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
