'use client'

import { useState, useEffect } from 'react'

interface EmailFlow {
  flowName: string
  campaign: string
  revenue: number
  orders: number
  percentage: number
}

interface AttributionData {
  totalRevenue: number
  flows: EmailFlow[]
}

export default function AttributionBreakdown() {
  const [data, setData] = useState<AttributionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetchAttributionData()
  }, [days])

  const fetchAttributionData = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const response = await fetch(
        `/api/attribution/email-flows?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      )

      if (response.ok) {
        const attribution = await response.json()
        setData(attribution)
      }
    } catch (error) {
      console.error('Failed to fetch attribution data:', error)
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

  if (!data || data.flows.length === 0) {
    return (
      <div className="glass-card p-8">
        <h3 className="text-xl font-display font-semibold mb-4">Email Flow Attribution</h3>
        <div className="text-center py-12 text-ice-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-ice-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg mb-2">No email-attributed revenue yet</p>
          <p className="text-sm text-ice-600">
            Revenue from email flows will appear here once customers purchase using your flow links
          </p>
        </div>
      </div>
    )
  }

  // Get flow name display
  const getFlowDisplayName = (flowName: string) => {
    const names: Record<string, string> = {
      abandoned_cart: 'Abandoned Cart',
      win_back: 'Win-Back',
      welcome: 'Welcome Series',
      post_purchase: 'Post-Purchase',
      browse_abandonment: 'Browse Abandonment',
      unknown: 'Other',
    }
    return names[flowName] || flowName
  }

  // Sort flows by revenue
  const sortedFlows = [...data.flows].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  return (
    <div className="glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-semibold">
          Email Flow Performance
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setDays(7)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              days === 7
                ? 'bg-ocean-600 text-white'
                : 'bg-ice-900/50 text-ice-400 hover:bg-ice-900'
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setDays(30)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              days === 30
                ? 'bg-ocean-600 text-white'
                : 'bg-ice-900/50 text-ice-400 hover:bg-ice-900'
            }`}
          >
            30D
          </button>
          <button
            onClick={() => setDays(90)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              days === 90
                ? 'bg-ocean-600 text-white'
                : 'bg-ice-900/50 text-ice-400 hover:bg-ice-900'
            }`}
          >
            90D
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-ocean-600/10 border border-ocean-600/30 rounded-lg">
        <div className="text-sm text-ice-400 mb-1">Total Email-Attributed Revenue</div>
        <div className="text-3xl font-display font-bold gradient-text">
          ${data.totalRevenue.toLocaleString()}
        </div>
      </div>

      <div className="space-y-4">
        {sortedFlows.map((flow, index) => (
          <div key={index} className="border border-ice-800/30 rounded-lg p-4 hover:bg-ice-900/20 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-ice-200">
                  {getFlowDisplayName(flow.flowName)}
                </div>
                {flow.campaign && flow.campaign !== 'unknown' && (
                  <div className="text-xs text-ice-500 mt-1">
                    Campaign: {flow.campaign}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold gradient-text">
                  ${flow.revenue.toLocaleString()}
                </div>
                <div className="text-xs text-ice-500">
                  {flow.orders} orders
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-ice-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ocean-600 to-ocean-500"
                style={{ width: `${flow.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-ice-500">
              <span>{flow.percentage.toFixed(1)}% of email revenue</span>
              <span>${(flow.revenue / flow.orders).toFixed(2)} per order</span>
            </div>
          </div>
        ))}
      </div>

      {sortedFlows.length === 0 && (
        <div className="text-center py-8 text-ice-500">
          No email flows generating revenue yet
        </div>
      )}
    </div>
  )
}
