import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { deviceId, imageData, commandId } = await request.json()

    if (!deviceId || !imageData) {
      return NextResponse.json(
        { error: 'deviceId and imageData are required' },
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

    // Convert base64 to buffer to get size
    const buffer = Buffer.from(imageData.split(',')[1], 'base64')
    const sizeBytes = buffer.length

    // Store screenshot with base64 data
    const { data: screenshot, error } = await supabase
      .from('screenshots')
      .insert({
        device_id: deviceId,
        image_data: imageData,
        filename: `screenshot-${Date.now()}.png`,
        size_bytes: sizeBytes
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to store screenshot' },
        { status: 500 }
      )
    }

    // Mark command as completed if commandId provided
    if (commandId) {
      await supabase
        .from('screenshot_commands')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', commandId)
    }

    return NextResponse.json(screenshot)
  } catch (error) {
    console.error('Screenshot upload error:', error)
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
    const limit = parseInt(searchParams.get('limit') || '10')

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

    // Get recent screenshots
    const { data: screenshots } = await supabase
      .from('screenshots')
      .select('*')
      .eq('device_id', deviceId)
      .order('captured_at', { ascending: false })
      .limit(limit)

    return NextResponse.json(screenshots || [])
  } catch (error) {
    console.error('Get screenshots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
