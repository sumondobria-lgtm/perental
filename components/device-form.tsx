'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface DeviceFormProps {
  userId: string
  onDeviceAdded: () => void
}

export function DeviceForm({ userId, onDeviceAdded }: DeviceFormProps) {
  const [deviceName, setDeviceName] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!deviceName.trim() || !pairingCode.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const { error: insertError } = await supabase.from('devices').insert({
        user_id: userId,
        device_name: deviceName.trim(),
        pairing_code: pairingCode.trim(),
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setDeviceName('')
      setPairingCode('')
      
      setTimeout(() => {
        setSuccess(false)
        onDeviceAdded()
      }, 2000)
    } catch (err) {
      setError('Failed to add device. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">Add Child Device</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="deviceName" className="block text-sm font-medium text-foreground mb-2">
            Device Name
          </label>
          <Input
            id="deviceName"
            type="text"
            placeholder="e.g., Sarah's iPhone"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="pairingCode" className="block text-sm font-medium text-foreground mb-2">
            Pairing Code
          </label>
          <Input
            id="pairingCode"
            type="text"
            placeholder="Enter the 6-digit code from the child device"
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Find the pairing code in the child app&apos;s settings
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            Device added successfully!
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
          disabled={loading}
        >
          {loading ? 'Adding Device...' : 'Add Device'}
        </Button>
      </form>
    </Card>
  )
}
