# Location Tracking Feature Guide

## Overview

The location tracking feature enables parents to monitor their children's device locations in real-time. Children share their GPS coordinates every 30 seconds, and parents view current location on a map with a 24-hour history.

## Architecture

### Database Layer

#### location_history Table
Stores all GPS coordinates, accuracy data, and reverse-geocoded addresses.

```sql
CREATE TABLE public.location_history (
  id UUID PRIMARY KEY,
  device_id UUID REFERENCES devices(id),
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  accuracy NUMERIC(10, 2),
  timestamp TIMESTAMP,
  address TEXT,
  created_at TIMESTAMP
)
```

**Indexes**:
- `(device_id, timestamp DESC)` - Fast device history queries
- `(timestamp DESC)` - Fast time-range queries

**RLS Policies**:
- Parents can SELECT/INSERT location records for their own devices
- Devices automatically have access via child app's session

#### current_location View
Returns the most recent location for each device without scanning the entire table.

```sql
CREATE OR REPLACE VIEW public.current_location AS
SELECT DISTINCT ON (device_id)
  device_id, latitude, longitude, accuracy, timestamp, address
FROM public.location_history
ORDER BY device_id, timestamp DESC
```

### API Endpoints

#### POST /api/location
**Child App → Server**: Send GPS coordinates from child device.

**Request**:
```json
{
  "deviceId": "uuid",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 15.5
}
```

**Response**: `{ "success": true, "data": {...} }`

**Features**:
- Validates coordinate range (-90 to 90 latitude, -180 to 180 longitude)
- Calls Nominatim API for reverse geocoding
- Inserts record with server-side timestamp (prevents client time manipulation)

#### GET /api/location?deviceId=uuid
**Parent Dashboard → Server**: Get the most recent location for a device.

**Response**:
```json
{
  "id": "uuid",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "accuracy": 15.5,
  "timestamp": "2026-06-09T14:30:00Z",
  "address": "Market St, San Francisco, CA"
}
```

#### GET /api/location-history?deviceId=uuid&hours=24
**Parent Dashboard → Server**: Get location history for specified time period.

**Response**:
```json
{
  "data": [
    { "id": "uuid", "latitude": 37.7749, "longitude": -122.4194, ... },
    ...
  ],
  "count": 48,
  "from": "2026-06-08T14:30:00Z",
  "to": "2026-06-09T14:30:00Z"
}
```

#### POST /api/validate-pairing-code
**Child App → Server**: Validate pairing code and get device ID.

**Request**:
```json
{ "pairingCode": "ABC123" }
```

**Response**:
```json
{
  "deviceId": "uuid",
  "deviceName": "Sarah's iPhone"
}
```

## Client-Side Implementation

### Child Location Sharing (/track/[deviceId])

**Geolocation Tracking**:
```javascript
navigator.geolocation.watchPosition(
  (position) => {
    // Send location every 30 seconds via API
    fetch('/api/location', {
      method: 'POST',
      body: JSON.stringify({
        deviceId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      })
    })
  },
  (err) => handleError(err),
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
)
```

**Key Features**:
- Requests browser geolocation permission
- Uses `watchPosition()` to continuously track instead of `getCurrentPosition()` (one-time)
- Sends updates every 30 seconds automatically
- Shows real-time status: active indicator, update count, last update time
- Allows child to stop sharing at any time
- Mobile-optimized UI with clear call-to-action

### Parent Tracking Dashboard (/dashboard/track/[deviceId])

**Map Component** (`location-map.tsx`):
- Leaflet map with OpenStreetMap tiles
- Blue marker indicating device location
- Popup showing device name, address, and update time
- Auto-centers on device location with zoom level 15

**History Component** (`location-history-list.tsx`):
- Scrollable list of locations from past 24 hours
- Sorted by most recent first
- Shows address, time, and GPS accuracy (±meters)
- Auto-refreshes every 30 seconds to match child's update interval
- Compact card design for readability

**Layout**:
- 70% width: Leaflet map
- 30% width: Location history list
- Two-column grid responsive design

## Reverse Geocoding

The app uses **OpenStreetMap Nominatim** API for free, reliable address lookup:

```javascript
const response = await fetch(
  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
)
const { address } = await response.json()
// Returns: { road: "Market St", city: "San Francisco", ... }
```

**Why Nominatim**:
- Free tier with no API key required
- Accurate for most use cases
- Open-source data
- Respects rate limits (1 request per second)
- Good coverage worldwide

## Security

### RLS Policies
- Parents can only view locations for devices they own
- Devices insert locations that reference their ID
- Cross-user access prevented at database level

### API Validation
- `/api/location` validates coordinate ranges
- Pairing code validation prevents unauthorized devices
- Server-side timestamp prevents client tampering

### Data Privacy
- GPS coordinates stored in secure PostgreSQL database
- Supabase encryption at rest
- Session tokens required for all requests
- Geolocation permission required on device before sending

## Performance Considerations

### Update Frequency
- Child sends location every **30 seconds** (configurable in `watchPosition()`)
- Parent dashboard refreshes every **10 seconds** (configurable in useEffect)
- Balance between accuracy and battery/network consumption

### Database Indexes
Two indexes optimize the most common queries:
1. `(device_id, timestamp DESC)` - Get history for specific device
2. `(timestamp DESC)` - Age-off old records (future: add cleanup job)

### Reverse Geocoding Caching
Each location record stores the address to avoid repeated API calls when browsing history.

## Testing Location Tracking

### Without Real Device
1. Open browser DevTools → Sensors tab
2. Spoof GPS location: Set to San Francisco (37.7749, -122.4194)
3. Go to `/track` and enter pairing code
4. Parent dashboard should show location on map

### With Real Device
1. Parent adds device with pairing code
2. Child opens `/track` → enters pairing code
3. Grants location permission in browser/app
4. After 30 seconds, parent should see location on map

## Future Enhancements

- **Geofencing**: Alert parents when child enters/exits safe zones
- **Route History**: Show complete day's movement as connected line on map
- **Accuracy Filtering**: Hide low-accuracy points
- **Multiple Children**: Track multiple child devices on single map
- **Offline Support**: Cache recent locations for offline access
- **Real-time Updates**: Use WebSockets instead of polling
- **Data Cleanup**: Automatic deletion of records older than 30 days

## Troubleshooting

### "No location data available yet"
- Child hasn't completed pairing yet
- Child hasn't granted location permission
- Check if child app is still running and in foreground/background

### Map not rendering
- Check browser console for Leaflet CSS/JS load errors
- Verify `react-leaflet` and `leaflet` are installed
- Clear browser cache and hard refresh

### Addresses showing as coordinates
- Nominatim API unreachable
- Rate limit exceeded (wait 1+ second between requests)
- Invalid coordinates provided (should still work with fallback)

### Location updates stopping
- Child device lost internet connection
- Browser backgrounded on restrictive OS (iOS needs explicit permission)
- Child clicked "Stop Sharing"
