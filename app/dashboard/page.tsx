'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { DeviceForm } from '@/components/device-form'
import { DeviceList } from '@/components/device-list'

interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.log('[v0] Error fetching profile:', error)
          router.push('/auth/login')
          return
        }

        setProfile(data)
        setLoading(false)
      } catch (err) {
        console.log('[v0] Unexpected error:', err)
        router.push('/auth/login')
      }
    }

    fetchProfile()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleDeviceAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const displayName = profile.first_name ? profile.first_name : 'Parent'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ParentGuard</h1>
            <p className="text-sm text-muted-foreground">Device Monitoring Dashboard</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {displayName}!
          </h2>
          <p className="text-muted-foreground">
            Manage and monitor your children&apos;s devices securely. Add pairing codes from their
            devices to start tracking location and activity.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <DeviceForm userId={profile.id} onDeviceAdded={handleDeviceAdded} />
          </div>

          {/* Right Column - Device List */}
          <div className="lg:col-span-2">
            <DeviceList userId={profile.id} refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  )
}
