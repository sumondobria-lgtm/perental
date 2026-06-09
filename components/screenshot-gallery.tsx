'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Screenshot {
  id: string
  image_data: string
  filename: string
  captured_at: string
  size_bytes: number
}

interface ScreenshotGalleryProps {
  deviceId: string
}

export function ScreenshotGallery({ deviceId }: ScreenshotGalleryProps) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null)

  const loadScreenshots = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/screenshot-upload?deviceId=${deviceId}&limit=12`
      )
      if (response.ok) {
        const data = await response.json()
        setScreenshots(data)
      }
    } catch (error) {
      console.error('Failed to load screenshots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadScreenshots()
    // Refresh every 30 seconds
    const interval = setInterval(loadScreenshots, 30000)
    return () => clearInterval(interval)
  }, [deviceId])

  const deleteScreenshot = async (id: string) => {
    try {
      const response = await fetch('/api/screenshot-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenshotId: id, deviceId })
      })

      if (response.ok) {
        setScreenshots(screenshots.filter((s) => s.id !== id))
        setSelectedScreenshot(null)
      }
    } catch (error) {
      console.error('Failed to delete screenshot:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Screenshot Gallery</h3>
        <Button
          onClick={loadScreenshots}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Enlarged Selected Screenshot */}
      {selectedScreenshot && (
        <Card className="mb-4 bg-black/5">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              <div className="relative w-full bg-black/10 rounded overflow-hidden">
                <img
                  src={selectedScreenshot.image_data}
                  alt={selectedScreenshot.filename}
                  className="w-full h-auto"
                />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <strong>Captured:</strong> {formatDate(selectedScreenshot.captured_at)}
                </p>
                <p className="text-muted-foreground">
                  <strong>Size:</strong> {formatFileSize(selectedScreenshot.size_bytes)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedScreenshot(null)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => deleteScreenshot(selectedScreenshot.id)}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshot Grid */}
      {screenshots.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {isLoading ? 'Loading screenshots...' : 'No screenshots yet. Request one from the parent dashboard.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {screenshots.map((screenshot) => (
            <button
              key={screenshot.id}
              onClick={() => setSelectedScreenshot(screenshot)}
              className="relative group overflow-hidden rounded border-2 border-transparent hover:border-blue-500 transition-colors bg-muted aspect-square"
            >
              <img
                src={screenshot.image_data}
                alt={screenshot.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                <div className="w-full bg-black/70 text-white text-xs p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  {formatDate(screenshot.captured_at).split(',')[1]}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
