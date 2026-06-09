'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { formatDistanceToNow } from 'date-fns'

interface AppUsage {
  id: string
  app_name: string
  usage_seconds: number
  last_opened: string
  session_count: number
}

interface AppUsageChartProps {
  deviceId: string
}

export function AppUsageChart({ deviceId }: AppUsageChartProps) {
  const [appUsage, setAppUsage] = useState<AppUsage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadAppUsage = async () => {
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/app-usage?deviceId=${deviceId}&date=${today}`)
      if (response.ok) {
        const data = await response.json()
        setAppUsage(data)
      }
    } catch (error) {
      console.error('Failed to load app usage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAppUsage()
    // Refresh every minute
    const interval = setInterval(loadAppUsage, 60000)
    return () => clearInterval(interval)
  }, [deviceId])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const chartData = appUsage.map((app) => ({
    name: app.app_name.length > 12 ? app.app_name.substring(0, 12) + '...' : app.app_name,
    fullName: app.app_name,
    duration: Math.round(app.usage_seconds / 60), // Convert to minutes for readability
    sessions: app.session_count
  }))

  const COLORS = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899'  // pink
  ]

  const getTotalUsage = () => {
    const total = appUsage.reduce((sum, app) => sum + app.usage_seconds, 0)
    return formatDuration(total)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>App Usage Today</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Total: {getTotalUsage()}
            </p>
          </div>
          <button
            onClick={loadAppUsage}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {appUsage.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            {isLoading ? 'Loading app usage data...' : 'No app usage data available'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
                formatter={(value, name) => {
                  if (name === 'duration') {
                    const hours = Math.floor((value as number) / 60)
                    const mins = (value as number) % 60
                    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
                  }
                  return value
                }}
                labelFormatter={(label) => {
                  const app = chartData.find((a) => a.name === label)
                  return app?.fullName || label
                }}
              />
              <Legend />
              <Bar
                dataKey="duration"
                fill="#3b82f6"
                name="Usage (minutes)"
                radius={[8, 8, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* App List */}
        {appUsage.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="font-semibold text-sm">App Details</h4>
            <div className="space-y-2">
              {appUsage.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{app.app_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Sessions: {app.session_count}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      {formatDuration(app.usage_seconds)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.last_opened
                        ? `Last: ${formatDistanceToNow(new Date(app.last_opened), { addSuffix: true })}`
                        : 'Never'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
