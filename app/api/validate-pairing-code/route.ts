import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pairingCode } = await request.json()

    if (!pairingCode || pairingCode.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid pairing code format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Query the devices table for a matching pairing code
    const { data, error } = await supabase
      .from('devices')
      .select('id, device_name')
      .eq('pairing_code', pairingCode.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Pairing code not found or invalid' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      deviceId: data.id,
      deviceName: data.device_name
    })
  } catch (error) {
    console.error('[v0] Validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
