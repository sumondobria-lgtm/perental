import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { deviceId, apps } = await request.json()

    if (!deviceId || !Array.isArray(apps)) {
      return NextResponse.json(
        { error: 'deviceId and apps array are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the device
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single()

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found or unauthorized' },
        { status: 404 }
      )
    }

    // Upsert app usage records
    const today = new Date().toISOString().split('T')[0]
    const usageRecords = apps.map((app) => ({
      device_id: deviceId,
      app_name: app.appName,
      package_name: app.packageName,
      usage_seconds: app.usageSeconds,
      last_opened: app.lastOpened,
      session_count: app.sessionCount || 1,
      tracked_date: today
    }))

    const { data: results, error } = await supabase
      .from('app_usage')
      .upsert(usageRecords, {
        onConflict: 'device_id,app_name,tracked_date'
      })
      .select()

    if (error) {
      console.error('Upsert error:', error)
      return NextResponse.json(
        { error: 'Failed to store app usage' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, records: results })
  } catch (error) {
    console.error('App usage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const date = searchParams.get('date')

    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns the device
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('id', deviceId)
      .eq('user_id', user.id)
      .single()

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get app usage for date
    const targetDate = date || new Date().toISOString().split('T')[0]
    const { data: appUsage } = await supabase
      .from('app_usage')
      .select('*')
      .eq('device_id', deviceId)
      .eq('tracked_date', targetDate)
      .order('usage_seconds', { ascending: false })

    return NextResponse.json(appUsage || [])
  } catch (error) {
    console.error('Get app usage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
