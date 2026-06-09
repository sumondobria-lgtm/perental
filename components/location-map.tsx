'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationMapProps {
  latitude: number
  longitude: number
  deviceName: string
  address: string
  timestamp: string
}

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.setIcon(defaultIcon)

export function LocationMap({
  latitude,
  longitude,
  deviceName,
  address,
  timestamp
}: LocationMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  const timeStr = new Date(timestamp).toLocaleTimeString()

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      className="h-full w-full rounded-lg"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={defaultIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-semibold">{deviceName}</p>
            <p className="text-xs text-gray-600">{address}</p>
            <p className="text-xs text-gray-500 mt-1">Updated: {timeStr}</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}
