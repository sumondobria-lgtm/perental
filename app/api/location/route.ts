import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to get address from coordinates using Nominatim
async function getAddress(latitude: number, longitude: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          'User-Agent': 'ParentGuard-LocationTracker/1.0'
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      return data.address?.road || data.address?.city || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  } catch (error) {
    console.error('[v0] Geocoding error:', error)
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { deviceId, latitude, longitude, accuracy } = await request.json()

    if (!deviceId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get address from coordinates
    const address = await getAddress(latitude, longitude)

    // Insert location record
    const { data, error } = await supabase
      .from('location_history')
      .insert({
        device_id: deviceId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        address,
        timestamp: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('[v0] Location insert error:', error)
      return NextResponse.json(
        { error: 'Failed to store location' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[v0] Location API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get current location for a device
export async function GET(request: NextRequest) {
  try {
    const deviceId = request.nextUrl.searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the most recent location for the device
    const { data, error } = await supabase
      .from('location_history')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'No location data found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Get location error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
