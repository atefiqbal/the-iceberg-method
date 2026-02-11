'use client'

import { useState, useEffect } from 'react'

interface DailyMetric {
  date: string
  revenue: number
  orders: number
  aov: number
}

interface RevenueMetrics {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  dailyMetrics: DailyMetric[]
}

export default function RevenueChart({ days = 30 }: { days?: number }) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRevenueData()
  }, [days])

  const fetchRevenueData = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const response = await fetch(
        `/api/metrics/revenue?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      )

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch revenue data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="flex items-center justify-center h-64">
          <svg
            className="w-8 h-8 text-ocean-400 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    )
  }

  if (!metrics || metrics.dailyMetrics.length === 0) {
    return (
      <div className="glass-card p-8">
        <h3 className="text-xl font-display font-semibold mb-4">
          Revenue Trend (Last {days} Days)
        </h3>
        <div className="flex items-center justify-center h-64 text-ice-500">
          No revenue data available yet
        </div>
      </div>
    )
  }

  // Calculate max revenue for scaling
  const maxRevenue = Math.max(...metrics.dailyMetrics.map((d) => d.revenue))
  const chartHeight = 200

  // Simple bar chart visualization
  const barWidth = 100 / metrics.dailyMetrics.length

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-semibold">
          Revenue Trend (Last {days} Days)
        </h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-ice-400">Total Revenue:</span>
            <span className="ml-2 font-semibold gradient-text">
              ${metrics.totalRevenue.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-ice-400">Orders:</span>
            <span className="ml-2 font-semibold text-ice-200">
              {metrics.totalOrders.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-ice-400">AOV:</span>
            <span className="ml-2 font-semibold text-ice-200">
              ${metrics.avgOrderValue.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Simple bar chart */}
      <div className="relative" style={{ height: `${chartHeight}px` }}>
        <div className="absolute inset-0 flex items-end justify-between gap-1">
          {metrics.dailyMetrics.map((day, index) => {
            const barHeight = (day.revenue / maxRevenue) * chartHeight
            const date = new Date(day.date)
            const formattedDate = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })

            return (
              <div
                key={index}
                className="group relative flex-1 flex flex-col justify-end"
                style={{ height: `${chartHeight}px` }}
              >
                {/* Bar */}
                <div
                  className="w-full bg-gradient-to-t from-ocean-600 to-ocean-500 rounded-t transition-all hover:from-ocean-500 hover:to-ocean-400"
                  style={{ height: `${barHeight}px` }}
                />

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-ice-900 border border-ice-800 rounded-lg p-3 text-xs whitespace-nowrap shadow-xl">
                    <div className="font-semibold text-ice-200 mb-1">
                      {formattedDate}
                    </div>
                    <div className="text-ice-400">
                      Revenue: <span className="text-mint-400">${day.revenue.toLocaleString()}</span>
                    </div>
                    <div className="text-ice-400">
                      Orders: <span className="text-ice-200">{day.orders}</span>
                    </div>
                    <div className="text-ice-400">
                      AOV: <span className="text-ice-200">${day.aov.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Y-axis labels */}
        <div className="absolute -left-12 top-0 h-full flex flex-col justify-between text-xs text-ice-500">
          <span>${(maxRevenue).toLocaleString()}</span>
          <span>${(maxRevenue * 0.5).toLocaleString()}</span>
          <span>$0</span>
        </div>
      </div>

      {/* X-axis */}
      <div className="mt-4 flex items-center justify-between text-xs text-ice-500">
        <span>
          {new Date(metrics.dailyMetrics[0].date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <span>Today</span>
      </div>
    </div>
  )
}
