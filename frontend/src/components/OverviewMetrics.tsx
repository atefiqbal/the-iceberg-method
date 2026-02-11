'use client'

import { useState, useEffect } from 'react'

interface OverviewData {
  last7Days: {
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
  }
  last30Days: {
    totalRevenue: number
    totalOrders: number
    avgOrderValue: number
  }
  emailAttribution: {
    totalRevenue: number
    flows: Array<{
      flowName: string
      revenue: number
      orders: number
      percentage: number
    }>
  }
}

export default function OverviewMetrics() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverviewData()
    const interval = setInterval(fetchOverviewData, 300000) // Refresh every 5 minutes
    return () => clearInterval(interval)
  }, [])

  const fetchOverviewData = async () => {
    try {
      const response = await fetch('/api/metrics/overview')

      if (response.ok) {
        const overview = await response.json()
        setData(overview)
      }
    } catch (error) {
      console.error('Failed to fetch overview data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="metric-card opacity-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-ice-400 text-sm">Loading...</span>
              <svg
                className="w-4 h-4 text-ice-600 animate-spin"
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
            <p className="text-3xl font-display font-bold text-ice-700 mb-2">--</p>
            <p className="text-sm text-ice-600">Calculating...</p>
          </div>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass-card p-8 text-center text-ice-500">
        No overview data available
      </div>
    )
  }

  const postPurchaseRevenue = data.emailAttribution.totalRevenue
  const totalRevenue30Days = data.last30Days.totalRevenue
  const postPurchasePct =
    totalRevenue30Days > 0 ? (postPurchaseRevenue / totalRevenue30Days) * 100 : 0

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* 7-Day Revenue */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-ice-400 text-sm">Last 7 Days</span>
          <svg
            className="w-5 h-5 text-mint-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <p className="text-3xl font-display font-bold gradient-text mb-2">
          ${data.last7Days.totalRevenue.toLocaleString()}
        </p>
        <div className="text-sm text-ice-500">
          {data.last7Days.totalOrders} orders · ${data.last7Days.avgOrderValue.toFixed(2)} AOV
        </div>
      </div>

      {/* 30-Day Revenue */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-ice-400 text-sm">Last 30 Days</span>
          <svg
            className="w-5 h-5 text-ocean-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <p className="text-3xl font-display font-bold gradient-text mb-2">
          ${data.last30Days.totalRevenue.toLocaleString()}
        </p>
        <div className="text-sm text-ice-500">
          {data.last30Days.totalOrders} orders · ${data.last30Days.avgOrderValue.toFixed(2)} AOV
        </div>
      </div>

      {/* Post-Purchase % */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-ice-400 text-sm">Post-Purchase Revenue</span>
          {postPurchasePct >= 20 ? (
            <span className="text-xs text-mint-400 px-2 py-1 bg-mint-400/10 rounded font-semibold">
              ✓ Target
            </span>
          ) : (
            <span className="text-xs text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded font-semibold">
              Below Target
            </span>
          )}
        </div>
        <p className="text-3xl font-display font-bold gradient-text mb-2">
          {postPurchasePct.toFixed(1)}%
        </p>
        <div className="text-sm text-ice-500">
          ${postPurchaseRevenue.toLocaleString()} from email flows
        </div>
        <div className="mt-3 text-xs text-ice-600">
          Target: 20-30% · Excellent: 40%+
        </div>
      </div>
    </div>
  )
}
