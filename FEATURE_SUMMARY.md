# ParentGuard - Complete Feature Summary

## Project Overview

ParentGuard is a comprehensive parental monitoring application built with Next.js 16, Supabase, and React. It provides parents with secure, real-time monitoring of their children's device locations, contacts, and call logs.

## Core Features

### 1. User Authentication
- **Email/Password Authentication**: Secure signup and login via Supabase Auth
- **Email Verification**: Automated email confirmation for new accounts
- **Session Management**: Secure cookie-based sessions with middleware protection
- **Row Level Security**: Database-level security via RLS policies

### 2. Device Management (Parent Dashboard)
- **Add Devices**: Create child device profiles with pairing codes
- **Device Status**: View pairing codes and last update timestamps
- **Device Tracking**: One-click access to monitoring dashboard
- **Device Removal**: Remove devices from monitoring list

### 3. Location Tracking

#### Child Interface (`/track/[deviceId]`)
- **Geolocation Permission**: Request device GPS access
- **Continuous Tracking**: Send GPS coordinates every 30 seconds
- **Status Display**: Real-time feedback on tracking status
- **Location Updates**: Display update count and last update time
- **Mobile Optimized**: Full-screen responsive design for smartphones

#### Parent Dashboard (`/dashboard/track/[deviceId]`)
- **Interactive Map**: Leaflet map with OpenStreetMap tiles
- **Current Location**: Display child's real-time location
- **Location History**: 24-hour history with timestamps and addresses
- **Auto-Refresh**: Updates every 10 seconds
- **Reverse Geocoding**: Free Nominatim API for address lookup

### 4. Contact Monitoring

#### Child Interface
- **Sync Contacts Button**: Manual contact sync from device
- **Permission Warning**: Clear notice about required READ_CONTACTS permission
- **Status Feedback**: Success/error messages for sync operations

#### Parent Dashboard Contacts Tab
- **Contact Table**: Name and phone number display
- **Search Functionality**: Filter by name or phone number
- **Contact Count**: Display total synced contacts
- **Sync Timestamps**: Show when contacts were last synced
- **Empty States**: Clear messaging when no data available

### 5. Call Log Monitoring

#### Child Interface
- **Sync Call Logs Button**: Manual call log sync from device
- **Permission Warning**: Clear notice about required READ_CALL_LOG permission
- **Status Feedback**: Success/error messages for sync operations

#### Parent Dashboard Call Logs Tab
- **Call Type Icons**:
  - ↓ (green) for incoming calls
  - ↑ (blue) for outgoing calls
  - ✕ (red) for missed calls
- **Call Details**: Contact name, phone number, duration, timestamp
- **Search Filtering**: Find calls by contact name or phone number
- **Duration Formatting**: Display as "Xm Ys" (e.g., "3m 25s")
- **Timestamp Display**: Full date and time of each call
- **Call Count**: Display total number of calls
- **Sorted by Time**: Newest calls displayed first

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with design tokens
- **Components**: shadcn/ui (Button, Input, Card, Table, Tabs, ScrollArea)
- **Maps**: Leaflet + React-Leaflet
- **State Management**: React hooks with SWR for data fetching
- **Client Libraries**: @supabase/ssr for session management

### Backend
- **Auth**: Supabase Auth with email/password
- **Database**: PostgreSQL with Row Level Security
- **API**: Next.js API Routes (Node.js runtime)
- **Reverse Geocoding**: OpenStreetMap Nominatim (free, no API key required)

### Infrastructure
- **Deployment**: Vercel (auto-deployed from GitHub)
- **Database Hosting**: Supabase Cloud
- **Session Handling**: Secure cookie middleware
- **Environment Variables**: Supabase connection details

## Database Schema

### Tables

**profiles**
- User information with ID referencing auth.users
- Stores first_name, last_name, email

**devices**
- Parent-created device profiles for children
- Includes device_name, pairing_code
- Foreign key to parent's user ID

**location_history**
- GPS coordinates (latitude, longitude, accuracy)
- Timestamps and reverse-geocoded addresses
- Indexed for efficient queries

**contacts**
- Phone contact name and number
- References device_id and synced_at
- Unique constraint prevents duplicates

**call_logs**
- Call history with type (incoming/outgoing/missed)
- Duration in seconds and call timestamp
- Phone number and contact name

### Views

**current_location**
- SQL view returning most recent location per device
- Sorted by timestamp DESC per device

## API Endpoints

### Authentication
- `POST /auth/callback` - OAuth/Email callback handler

### Location
- `POST /api/location` - Submit GPS coordinates
- `GET /api/location` - Get current location
- `GET /api/location-history` - Get 24-hour history

### Contacts
- `POST /api/sync-contacts` - Submit synced contacts
- `GET /api/sync-contacts` - Retrieve contacts list

### Call Logs
- `POST /api/sync-call-logs` - Submit synced call logs
- `GET /api/sync-call-logs` - Retrieve call logs list

### Validation
- `POST /api/validate-pairing-code` - Verify child pairing code

## Security Features

1. **Row Level Security (RLS)**
   - Parents can only view/edit their own devices' data
   - Devices can only submit data to themselves
   - All tables protected at database level

2. **Authentication**
   - Email verification required for new accounts
   - Session-based auth with secure cookies
   - Middleware protects dashboard routes

3. **API Validation**
   - Device ownership verification on every request
   - Input validation on contacts and call logs
   - Error messages don't reveal system details

4. **Data Privacy**
   - No sensitive data stored in client
   - Tokens secured in httpOnly cookies
   - RLS prevents cross-user data access

## File Structure

```
/app
  /api
    /location           - GPS tracking endpoints
    /location-history   - History retrieval
    /sync-contacts      - Contact sync endpoints
    /sync-call-logs     - Call log sync endpoints
    /validate-pairing-code
  /auth
    /login, /sign-up, /callback, /error
    layout.tsx          - Dynamic rendering
  /dashboard
    /track/[deviceId]   - Monitoring dashboard with tabs
    page.tsx            - Main dashboard
  /track
    /[deviceId]         - Child tracking interface
    page.tsx            - Pairing code entry
    layout.tsx          - Dynamic rendering
  layout.tsx            - Root layout
  page.tsx              - Redirect to login

/components
  /ui                   - shadcn components
  device-form.tsx       - Add device form
  device-list.tsx       - Device list with Track buttons
  location-map.tsx      - Leaflet map component
  location-history-list.tsx - Location history display
  contacts-table.tsx    - Searchable contacts table
  call-logs-table.tsx   - Filterable call logs table

/lib/supabase
  client.ts             - Browser client
  server.ts             - Server client
  proxy.ts              - Middleware proxy
```

## User Workflows

### Parent Setup
1. Sign up with email and password
2. Verify email address
3. Add device with name and pairing code
4. Share pairing code with child
5. Access monitoring dashboard

### Child Device Setup
1. Navigate to `/track` and enter pairing code
2. Click "Start Sharing Location"
3. Grant geolocation permission
4. Optionally click "Sync Contacts" (requires Android)
5. Optionally click "Sync Call Logs" (requires Android)

### Parent Monitoring
1. Log in to dashboard
2. Click "Track" on device
3. View real-time location on map
4. Review location history (24 hours)
5. View synced contacts in Contacts tab
6. Review call logs in Call Logs tab
7. Search/filter data as needed

## Design Specifications

### Color Scheme
- **Primary**: Blue (#2563EB) for buttons and CTA
- **Background**: White (#FFFFFF)
- **Text**: Dark gray for primary, light gray for secondary
- **Error**: Red for warnings and errors
- **Success**: Green for positive actions

### Typography
- **Font**: Geist Sans (default system font)
- **Headings**: Bold, scaled sizes
- **Body**: Regular weight, readable line height

### Layout
- **Mobile-First**: Optimized for smartphones first
- **Responsive**: Adapts to tablet and desktop
- **Flexbox**: Primary layout method with gap spacing
- **Max Width**: Constrained to 7xl on desktop

## Testing

The application has been tested for:
- Build compilation (Next.js 16 with Turbopack)
- Authentication flow (login/signup)
- Device management (create, list, delete)
- Location tracking (map display, history)
- API endpoints (request/response)
- Mobile responsiveness (iPhone 14 tested)
- Database RLS policies

## Deployment

Deploy to Vercel:
1. Connect GitHub repository
2. Add Supabase environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_ROUTE_HANDLER_CACHE`
   - `SUPABASE_DB_PASSWORD`
3. Deploy automatically on git push

## Future Enhancements

1. **Contact Features**
   - Auto-sync contacts at intervals
   - Contact group organization
   - Contact history tracking

2. **Call Log Features**
   - Call statistics and analytics
   - Call pattern visualization
   - Call duration trends

3. **Location Features**
   - Geofence alerts
   - Location history export
   - Battery optimization

4. **Monitoring Features**
   - SMS message monitoring
   - App usage tracking
   - Web history monitoring

5. **Parent Features**
   - Multiple account support
   - Sibling device comparison
   - Custom alerts and notifications

## Support and Documentation

- **README.md**: Setup and configuration guide
- **LOCATION_TRACKING.md**: Location feature documentation
- **CONTACT_MONITORING.md**: Contact/call log feature guide
- **GitHub**: Full source code with commit history

## License

Proprietary - ParentGuard Device Monitoring System
