'use client'

import { useState } from 'react'
import html2canvas from 'html2canvas'

export function useScreenshot() {
  const [isCapturing, setIsCapturing] = useState(false)

  const captureScreen = async (deviceId: string, commandId?: string) => {
    setIsCapturing(true)
    try {
      // Capture the visible viewport
      const canvas = await html2canvas(document.body, {
        allowTaint: true,
        useCORS: true,
        scale: 1,
        backgroundColor: '#ffffff'
      })

      // Convert canvas to base64 PNG
      const imageData = canvas.toDataURL('image/png')

      // Upload screenshot
      const response = await fetch('/api/screenshot-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          imageData,
          commandId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to upload screenshot')
      }

      return await response.json()
    } catch (error) {
      console.error('Screenshot capture error:', error)
      throw error
    } finally {
      setIsCapturing(false)
    }
  }

  return { captureScreen, isCapturing }
}
