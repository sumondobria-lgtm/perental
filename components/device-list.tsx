'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface Device {
  id: string
  device_name: string
  pairing_code: string
  paired_at: string
}

interface DeviceListProps {
  userId: string
  refreshTrigger: number
}

export function DeviceList({ userId, refreshTrigger }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDevices()
  }, [userId, refreshTrigger])

  const fetchDevices = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .order('paired_at', { ascending: false })

      if (fetchError) {
        setError('Failed to load devices')
        setLoading(false)
        return
      }

      setDevices(data || [])
    } catch (err) {
      setError('An error occurred while loading devices')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) {
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId)

      if (deleteError) {
        setError('Failed to delete device')
        return
      }

      setDevices(devices.filter((d) => d.id !== deviceId))
    } catch (err) {
      setError('Failed to delete device')
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Loading devices...</p>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-600">{error}</p>
      </Card>
    )
  }

  if (devices.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          No devices added yet. Add a child device above to get started.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Your Devices</h2>
      {devices.map((device) => (
        <Card key={device.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{device.device_name}</h3>
              <p className="text-sm text-muted-foreground">
                Paired: {new Date(device.paired_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Code: <span className="font-mono">{device.pairing_code}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/track/${device.id}`}>
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Track
                </Button>
              </Link>
              <Button
                onClick={() => handleDelete(device.id)}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
              >
                Remove
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
