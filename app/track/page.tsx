'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TrackingPage() {
  const [pairingCode, setPairingCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Validate that pairing code exists and belongs to a device
      const response = await fetch('/api/validate-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Invalid pairing code')
        setIsLoading(false)
        return
      }

      const { deviceId } = await response.json()
      
      // Redirect to location tracking page with device ID
      router.push(`/track/${deviceId}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('[v0] Pairing code error:', err)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Device Tracking</CardTitle>
            <CardDescription>Enter your pairing code to share your location</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="pairingCode" className="text-sm font-medium">
                  Pairing Code
                </label>
                <Input
                  id="pairingCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || pairingCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Verifying...' : 'Start Sharing Location'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Your location will be shared with the device owner for the next 24 hours.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
