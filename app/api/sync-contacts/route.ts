'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient(await cookies());
    const body = await request.json();
    
    const { deviceId, contacts } = body;

    if (!deviceId || !Array.isArray(contacts)) {
      return Response.json(
        { error: 'Invalid request: deviceId and contacts array required' },
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

    // Sync contacts - upsert by device_id and phone_number
    const { error: syncError } = await supabase
      .from('contacts')
      .upsert(
        contacts.map((contact: any) => ({
          device_id: deviceId,
          name: contact.name || contact.phone_number,
          phone_number: contact.phone_number,
          display_name: contact.display_name,
          synced_at: new Date().toISOString(),
        })),
        { onConflict: 'device_id,phone_number' }
      );

    if (syncError) {
      console.error('Contact sync error:', syncError);
      return Response.json(
        { error: 'Failed to sync contacts' },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: `Synced ${contacts.length} contacts`,
      count: contacts.length,
    });
  } catch (error) {
    console.error('Sync contacts error:', error);
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

    if (!deviceId) {
      return Response.json(
        { error: 'deviceId required' },
        { status: 400 }
      );
    }

    // Get contacts for device
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('device_id', deviceId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Get contacts error:', error);
      return Response.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    return Response.json({ contacts: contacts || [] });
  } catch (error) {
    console.error('Get contacts error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
