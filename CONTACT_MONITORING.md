# Contact and Call Log Monitoring Feature

## Overview

The Contact and Call Log Monitoring feature allows parents to view synced contacts and call logs from their children's devices. Children can manually sync this data from their Android devices, and parents can review it in the dashboard.

## Database Schema

### contacts table
- `id` (UUID) - Record ID
- `device_id` (UUID) - Device ID (FK to devices)
- `name` (TEXT) - Contact name
- `phone_number` (TEXT) - Contact phone number
- `display_name` (TEXT) - Optional display name
- `synced_at` (TIMESTAMP) - When contact was synced
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time
- **Unique constraint**: `(device_id, phone_number)` - Prevents duplicate contacts

**Indexes**:
- `(device_id)` - For device queries
- `(name)` - For name search
- `(phone_number)` - For phone search

### call_logs table
- `id` (UUID) - Record ID
- `device_id` (UUID) - Device ID (FK to devices)
- `caller_name` (TEXT) - Contact name or null for unknown callers
- `phone_number` (TEXT) - Calling/called phone number
- `call_type` (TEXT) - 'incoming', 'outgoing', or 'missed'
- `duration` (INTEGER) - Call duration in seconds
- `timestamp` (TIMESTAMP) - When the call occurred
- `synced_at` (TIMESTAMP) - When synced to server
- `created_at` (TIMESTAMP) - Record creation time

**Indexes**:
- `(device_id)` - For device queries
- `(timestamp DESC)` - For recent calls queries
- `(phone_number)` - For phone search

## API Endpoints

### POST /api/sync-contacts
**Purpose**: Child device submits contacts to server

**Request body**:
```json
{
  "deviceId": "device-uuid",
  "contacts": [
    {
      "name": "John Doe",
      "phone_number": "+1234567890",
      "display_name": "John"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Synced 42 contacts",
  "count": 42
}
```

**Validation**:
- Verifies user owns the device
- Upserts contacts by (device_id, phone_number) to avoid duplicates
- Updates synced_at timestamp

### GET /api/sync-contacts?deviceId={deviceId}
**Purpose**: Parent retrieves synced contacts for a device

**Response**:
```json
{
  "contacts": [
    {
      "id": "uuid",
      "device_id": "device-uuid",
      "name": "John Doe",
      "phone_number": "+1234567890",
      "synced_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/sync-call-logs
**Purpose**: Child device submits call logs to server

**Request body**:
```json
{
  "deviceId": "device-uuid",
  "callLogs": [
    {
      "caller_name": "John Doe",
      "phone_number": "+1234567890",
      "call_type": "incoming",
      "duration": 180,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Synced 15 call logs",
  "count": 15
}
```

**Validation**:
- Verifies user owns the device
- Inserts call logs (allows duplicates as these are historical records)
- call_type must be 'incoming', 'outgoing', or 'missed'

### GET /api/sync-call-logs?deviceId={deviceId}&limit={limit}
**Purpose**: Parent retrieves call logs for a device

**Query parameters**:
- `deviceId` (required) - Device UUID
- `limit` (optional, default 100) - Maximum records to return

**Response**:
```json
{
  "callLogs": [
    {
      "id": "uuid",
      "device_id": "device-uuid",
      "caller_name": "John Doe",
      "phone_number": "+1234567890",
      "call_type": "incoming",
      "duration": 180,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Child Interface

### Location at `/track/[deviceId]`

The child interface includes two new sync buttons:

1. **Sync Contacts Button**
   - Located in "Manual Sync" card
   - In real Android app: Would read native contacts using Android Bridge/React Native
   - Shows warning about required permissions: READ_CONTACTS

2. **Sync Call Logs Button**
   - Located in "Manual Sync" card
   - In real Android app: Would read call logs using Android Bridge/React Native
   - Shows warning about required permissions: READ_CALL_LOG

**Android WebView Implementation Notes**:
- The web interface provides the UI and API endpoints
- Real Android functionality requires:
  - React Native with native modules, OR
  - Android WebView with native JavaScript bridge
  - AndroidManifest.xml permissions:
    ```xml
    <uses-permission android:name="android.permission.READ_CONTACTS" />
    <uses-permission android:name="android.permission.READ_CALL_LOG" />
    ```
  - Runtime permission requests (Android 6.0+)

## Parent Dashboard

### Dashboard at `/dashboard/track/[deviceId]`

The parent dashboard now includes three tabs:

#### 1. Location Tab (Default)
- Interactive Leaflet map showing current device location
- Location history for past 24 hours
- Real-time updates every 10 seconds

#### 2. Contacts Tab
- **Table columns**: Name, Phone Number, Synced date
- **Search functionality**: Filter by name or phone number
- **Sorting**: Alphabetically by name by default
- **Count display**: Shows total number of contacts
- **Empty state**: Shows message when no contacts synced
- Real-time fetch from API

#### 3. Call Logs Tab
- **Table columns**: Type icon, Contact name, Phone number, Duration, Timestamp
- **Call type indicators**:
  - ↓ (green) - Incoming call
  - ↑ (blue) - Outgoing call
  - ✕ (red) - Missed call
- **Duration display**: Formatted as "Xm Ys" (e.g., "3m 25s"), or "—" for missed calls
- **Search functionality**: Filter by contact name or phone number
- **Sorting**: By timestamp (newest first) by default
- **Count display**: Shows total number of calls
- Real-time fetch from API

## Components

### ContactsTable
**File**: `/components/contacts-table.tsx`

Features:
- Client-side component with real-time search
- Fetches contacts from `/api/sync-contacts`
- Search filter on name and phone number
- Displays contact info in scrollable table
- Shows total contact count
- Loading and error states

**Props**:
```typescript
interface ContactsTableProps {
  deviceId: string
}
```

### CallLogsTable
**File**: `/components/call-logs-table.tsx`

Features:
- Client-side component with real-time search
- Fetches call logs from `/api/sync-call-logs`
- Search filter on contact name and phone number
- Call type indicators with color coding
- Duration formatting for readability
- Timestamp display with date and time
- Shows total call count
- Loading and error states

**Props**:
```typescript
interface CallLogsTableProps {
  deviceId: string
}
```

## Security

### Row Level Security (RLS)

All data is protected by RLS policies:

**contacts table**:
- SELECT: Users can only view contacts from devices they own
- INSERT: Users can only insert contacts for devices they own
- UPDATE: Users can only update contacts for devices they own
- DELETE: Users can only delete contacts for devices they own

**call_logs table**:
- SELECT: Users can only view call logs from devices they own
- INSERT: Users can only insert call logs for devices they own
- UPDATE: Users can only update call logs for devices they own
- DELETE: Users can only delete call logs for devices they own

### API Validation

Both API endpoints validate device ownership before:
- Accepting contact/call log submissions
- Returning contact/call log data

## Usage Workflow

### Child Device Setup
1. Parent creates device in dashboard with pairing code
2. Sends pairing code to child
3. Child enters pairing code in `/track/[pairingCode]`
4. Child clicks "Start Sharing Location"
5. Child can click "Sync Contacts" and "Sync Call Logs" buttons

### Parent Monitoring
1. Parent logs into dashboard
2. Clicks "Track" button on device
3. Views Location, Contacts, or Call Logs tabs
4. Searches/filters data as needed
5. Location updates automatically every 10 seconds

## Android Implementation Guide

For a production Android app, implement:

### 1. Native Module for Contacts
```kotlin
// Android native code to read contacts
val projection = arrayOf(
    ContactsContract.Contacts.DISPLAY_NAME,
    ContactsContract.CommonDataKinds.Phone.NUMBER
)
val cursor = contentResolver.query(
    ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
    projection, null, null, null
)
```

### 2. Native Module for Call Logs
```kotlin
// Android native code to read call logs
val projection = arrayOf(
    CallLog.Calls.CACHED_NAME,
    CallLog.Calls.NUMBER,
    CallLog.Calls.TYPE,
    CallLog.Calls.DURATION,
    CallLog.Calls.DATE
)
val cursor = contentResolver.query(
    CallLog.Calls.CONTENT_URI,
    projection, null, null, "${CallLog.Calls.DATE} DESC"
)
```

### 3. React Native Bridge
```typescript
import { NativeModules } from 'react-native'

const { ContactsModule, CallLogsModule } = NativeModules

// Call native functions
const contacts = await ContactsModule.getContacts()
const callLogs = await CallLogsModule.getCallLogs()
```

## Future Enhancements

1. **Auto-sync**: Periodically sync contacts and call logs automatically
2. **Filtering**: Filter call logs by date range or call type
3. **Export**: Export contact/call log data as CSV
4. **Analytics**: Show call statistics (total duration, incoming/outgoing ratio)
5. **Contact groups**: Organize and label contact groups
6. **Call patterns**: Visualize call frequency over time
