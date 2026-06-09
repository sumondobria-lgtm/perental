import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const deviceId = request.nextUrl.searchParams.get('deviceId')
    const hoursStr = request.nextUrl.searchParams.get('hours') || '24'

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing deviceId parameter' },
        { status: 400 }
      )
    }

    const hours = parseInt(hoursStr, 10)
    if (isNaN(hours) || hours < 1) {
      return NextResponse.json(
        { error: 'Invalid hours parameter' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Calculate timestamp for the beginning of the time range
    const fromTime = new Date()
    fromTime.setHours(fromTime.getHours() - hours)

    // Get location history for the specified time range
    const { data, error } = await supabase
      .from('location_history')
      .select('id, latitude, longitude, accuracy, timestamp, address')
      .eq('device_id', deviceId)
      .gte('timestamp', fromTime.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[v0] History query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch location history' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      count: (data || []).length,
      from: fromTime.toISOString(),
      to: new Date().toISOString()
    })
  } catch (error) {
    console.error('[v0] Location history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
