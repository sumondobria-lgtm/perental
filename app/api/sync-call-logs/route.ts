'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient(await cookies());
    const body = await request.json();
    
    const { deviceId, callLogs } = body;

    if (!deviceId || !Array.isArray(callLogs)) {
      return Response.json(
        { error: 'Invalid request: deviceId and callLogs array required' },
        { status: 400 }
      );
    }

    // Verify user owns this device
    const { data: device } = await supabase
      .from('devices')
      .select('id')
      .eq('id', deviceId)
      .single();

    if (!device) {
      return Response.json(
        { error: 'Device not found or unauthorized' },
        { status: 403 }
      );
    }

    // Insert call logs
    const { error: syncError } = await supabase
      .from('call_logs')
      .insert(
        callLogs.map((log: any) => ({
          device_id: deviceId,
          caller_name: log.caller_name,
          phone_number: log.phone_number,
          call_type: log.call_type, // 'incoming', 'outgoing', 'missed'
          duration: log.duration || 0,
          timestamp: log.timestamp,
        }))
      );

    if (syncError) {
      console.error('Call log sync error:', syncError);
      return Response.json(
        { error: 'Failed to sync call logs' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Synced ${callLogs.length} call logs`,
      count: callLogs.length,
    });
  } catch (error) {
    console.error('Sync call logs error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient(await cookies());
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!deviceId) {
      return Response.json(
        { error: 'deviceId required' },
        { status: 400 }
      );
    }

    // Get recent call logs for device
    const { data: callLogs, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get call logs error:', error);
      return Response.json(
        { error: 'Failed to fetch call logs' },
        { status: 500 }
      );
    }

    return Response.json({ callLogs: callLogs || [] });
  } catch (error) {
    console.error('Get call logs error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
