# ParentGuard - Parental Device Monitoring Application

A full-stack web application built with Next.js 16, Tailwind CSS, shadcn/ui, and Supabase for monitoring children's devices.

## Features

### Parent Features
- **User Authentication**: Email/password signup and login with Supabase Auth
- **Email Confirmation**: Secure email verification for new accounts
- **Protected Dashboard**: Authenticated users access a personalized dashboard
- **Device Management**: Add and manage child devices with pairing codes
- **Real-time Location Tracking**: View child device locations on an interactive Leaflet map
- **Location History**: Track location history for the past 24 hours with timestamps and addresses
- **Reverse Geocoding**: Automatic address lookup using OpenStreetMap Nominatim API
- **Device Status**: View pairing codes and last update timestamps for each device

### Child Features
- **Simple Pairing Code Entry**: Children enter a 6-digit pairing code to start sharing location
- **Location Sharing**: Request geolocation permission and start sending GPS coordinates
- **Automatic Updates**: Device sends location every 30 seconds while the app is open or backgrounded
- **Tracking Status**: Real-time feedback showing active status, update count, and accuracy
- **Mobile-First Design**: Optimized interface for smartphones and tablets

### General Features
- **Clean UI**: Modern, responsive design optimized for mobile and desktop
- **Row Level Security**: Database-level security with Supabase RLS policies
- **Accurate Mapping**: Leaflet map with OpenStreetMap tiles for reliable location display
- **Data Privacy**: Secure API endpoints that validate user ownership before sharing location data

## Tech Stack

- **Frontend**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth with email/password
- **Deployment**: Vercel

## Project Structure

```
/app
  /api
    /location              - POST/GET endpoint for location data
    /location-history      - GET endpoint for location history
    /validate-pairing-code - POST endpoint to validate child pairing codes
  /auth
    /callback          - OAuth/Email callback handler
    /error            - Authentication error page
    /login            - Login page
    /sign-up          - Sign-up page
    /sign-up-success  - Confirmation page
    layout.tsx        - Auth layout (force dynamic rendering)
  /dashboard
    /track
      /[deviceId]     - Parent tracking view with map and history
    layout.tsx        - Dashboard layout (force dynamic rendering)
    page.tsx          - Main dashboard with device management
  /track
    /[deviceId]       - Child active location sharing interface
    page.tsx          - Child pairing code entry screen
    layout.tsx        - Track layout (force dynamic rendering)
  layout.tsx          - Root layout with metadata
  page.tsx            - Redirects to /auth/login
  globals.css         - Global styles and design tokens

/components
  /ui
    button.tsx        - Button component (pre-installed)
    card.tsx          - Card component
    input.tsx         - Input component
    scroll-area.tsx   - Scrollable content container
  device-form.tsx     - Form to add new devices
  device-list.tsx     - List of paired devices with tracking links
  location-map.tsx    - Leaflet map component for displaying child locations
  location-history-list.tsx - List of location history entries

/lib/supabase
  client.ts           - Browser Supabase client
  server.ts           - Server-side Supabase client
  proxy.ts            - Middleware proxy client
  server.ts           - Server Supabase client
  proxy.ts            - Session management and cookies

middleware.ts         - Request middleware for auth session
```

## Database Schema

### profiles table
- `id` (UUID) - User ID (references auth.users)
- `email` (TEXT) - User email
- `first_name` (TEXT) - User's first name
- `last_name` (TEXT) - User's last name
- `created_at` (TIMESTAMP) - Account creation time
- `updated_at` (TIMESTAMP) - Last update time

**RLS Policies**: Users can only view/edit their own profile

### devices table
- `id` (UUID) - Device ID
- `user_id` (UUID) - Parent user ID (references profiles)
- `device_name` (TEXT) - Child device name
- `pairing_code` (TEXT) - 6-digit pairing code
- `paired_at` (TIMESTAMP) - When device was paired
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Last update time

**RLS Policies**: Users can only view/edit/delete their own devices

### location_history table
- `id` (UUID) - Location record ID
- `device_id` (UUID) - Device ID (references devices)
- `latitude` (NUMERIC) - GPS latitude coordinate
- `longitude` (NUMERIC) - GPS longitude coordinate
- `accuracy` (NUMERIC) - GPS accuracy in meters
- `timestamp` (TIMESTAMP) - When location was captured
- `address` (TEXT) - Reverse-geocoded address
- `created_at` (TIMESTAMP) - Record creation time

**RLS Policies**: Users can view location history for devices they own. Devices can insert location records for themselves.

**Indexes**: 
- `(device_id, timestamp DESC)` - For efficient device history queries
- `(timestamp DESC)` - For efficient timestamp range queries

### current_location view
A SQL view that returns the most recent location for each device, indexed by device_id and ordered by timestamp (DESC)

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Supabase project with authentication enabled

### Environment Variables

The following env vars are automatically set by the Supabase integration:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Usage

### Signing Up
1. Go to `/auth/sign-up`
2. Enter first name, email, and password
3. Verify your email address (check your inbox)
4. Sign in with your credentials

### Dashboard
After logging in, you'll be redirected to the dashboard where you can:
1. **View Your Profile**: See your name and email
2. **Add Devices**: Enter child device name and pairing code
3. **Manage Devices**: View, remove, or track paired devices

### Device Pairing
When adding a device:
- Enter a descriptive name (e.g., "Sarah's iPhone")
- Enter the 6-digit pairing code from the child's device
- Device is immediately added to your list with pairing date
- Once a device is paired, you can click "Track" to view its location

### Location Tracking (Parent View)
1. Go to dashboard and click "Track" on any device
2. View real-time location on interactive Leaflet map
3. See location history for the past 24 hours below the map
4. Click on marker for device name, address, and update time
5. Location updates automatically every 10 seconds

### Location Tracking (Child View)
1. Share the 6-digit pairing code with your child
2. Child opens `/track` and enters the pairing code
3. Child clicks "Start Sharing Location"
4. Grant location permission when prompted
5. Device will automatically send location every 30 seconds
6. Child can click "Stop Sharing" to disable tracking
7. Status shows number of updates sent and accuracy

### Location History
- Displays up to 24 hours of location data
- Shows address, time, and GPS accuracy (±meters)
- Automatically refreshes every 30 seconds
- Uses OpenStreetMap reverse geocoding for addresses
- Entries sorted by most recent first

## Design Details

### Colors (Light Theme)
- **Background**: White (#FFFFFF)
- **Primary**: Blue (#2563EB) - Action buttons
- **Text**: Dark Gray (#1A1A1A)
- **Borders**: Light Gray (#E5E5E5)

### Typography
- **Headings**: Geist Sans (Bold)
- **Body**: Geist Sans (Regular)

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Touch-optimized input fields and buttons
- Full-width layout on small screens
- Grid-based layout on larger screens (dashboard)

## Authentication Flow

1. **Sign Up**: Email + Password → Supabase Auth creates user → Trigger auto-creates profile
2. **Email Confirmation**: Supabase sends confirmation link
3. **Login**: Email + Password → Session created
4. **Session Management**: Middleware refreshes sessions via cookie
5. **Protected Routes**: Middleware redirects unauthenticated users to login
6. **Logout**: Sign out clears session and cookies

## Security

- **RLS Policies**: Database-level access control ensures users only see their own data
- **Session Management**: Secure HTTP-only cookies with Supabase session handling
- **Password Hashing**: Supabase handles password hashing with bcrypt
- **CSRF Protection**: Next.js middleware prevents cross-site requests

## Performance

- Optimized images and static assets
- Server-side rendering for SEO
- Client-side rendering for interactive pages
- Efficient database queries with RLS enforcement
- Mobile-responsive design for fast loading

## Future Enhancements

- Real-time device location tracking with Maps API
- Device activity logs and usage reports
- Geo-fencing alerts
- Social sign-in (Google, Apple)
- Multi-device management per child
- Usage analytics and reports
- Push notifications for device events

## Support

For issues or questions, contact support@parentguard.app
# perental
