'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface FunnelMetrics {
  currentWeek: {
    conversionRate: number
    checkouts: number
    orders: number
    averageOrderValue: number
  }
  previousWeek: {
    conversionRate: number
  }
  dailyTrend: Array<{
    date: string
    conversionRate: number
    checkouts: number
    orders: number
  }>
  consecutiveLowDays: number
  gateStatus: 'pass' | 'warning' | 'fail'
}

export default function FunnelThroughputPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null)

  useEffect(() => {
    fetchFunnelMetrics()
  }, [])

  async function fetchFunnelMetrics() {
    try {
      const response = await fetch('/api/metrics/funnel-throughput')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch funnel metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for demo
  const mockMetrics: FunnelMetrics = {
    currentWeek: {
      conversionRate: 3.8,
      checkouts: 245,
      orders: 93,
      averageOrderValue: 127.50,
    },
    previousWeek: {
      conversionRate: 3.6,
    },
    dailyTrend: [
      { date: '2024-01-22', conversionRate: 3.2, checkouts: 34, orders: 11 },
      { date: '2024-01-23', conversionRate: 4.1, checkouts: 38, orders: 16 },
      { date: '2024-01-24', conversionRate: 3.9, checkouts: 41, orders: 16 },
      { date: '2024-01-25', conversionRate: 3.6, checkouts: 35, orders: 13 },
      { date: '2024-01-26', conversionRate: 4.2, checkouts: 43, orders: 18 },
      { date: '2024-01-27', conversionRate: 3.5, checkouts: 31, orders: 11 },
      { date: '2024-01-28', conversionRate: 3.9, checkouts: 23, orders: 8 },
    ],
    consecutiveLowDays: 0,
    gateStatus: 'pass',
  }

  const currentMetrics = metrics || mockMetrics

  const variance =
    currentMetrics.currentWeek.conversionRate -
    currentMetrics.previousWeek.conversionRate
  const variancePercent =
    (variance / currentMetrics.previousWeek.conversionRate) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-ice-300">Loading funnel metrics...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ocean-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ice-50 mb-2">
              Phase 2: Funnel Throughput
            </h1>
            <p className="text-ice-400">
              Monitor conversion rate stability before scaling traffic
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Gate Status */}
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-ice-50">
              Funnel Throughput Gate
            </h2>
            <div
              className={`px-4 py-2 rounded-lg border ${
                currentMetrics.gateStatus === 'pass'
                  ? 'bg-mint-500/20 text-mint-400 border-mint-500/30'
                  : currentMetrics.gateStatus === 'warning'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-coral-500/20 text-coral-400 border-coral-500/30'
              }`}
            >
              {currentMetrics.gateStatus.toUpperCase()}
            </div>
          </div>

          {currentMetrics.gateStatus === 'fail' && (
            <div className="mb-6 p-4 rounded-lg bg-coral-500/10 border border-coral-500/30">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-coral-400 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="font-medium text-coral-300 mb-1">
                    Funnel Throughput Gate FAILED
                  </div>
                  <div className="text-coral-400/80 text-sm mb-3">
                    Conversion rate below 2% for 3 consecutive business days.
                    Do not scale paid acquisition—you're burning money on a broken funnel.
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-coral-600 text-white text-sm font-medium hover:bg-coral-700 transition-colors">
                    Override Gate (with reason)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-ice-400 mb-2">
                Current Week Conversion Rate
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-3xl font-bold text-ice-50">
                  {currentMetrics.currentWeek.conversionRate.toFixed(1)}%
                </div>
                <div
                  className={`text-sm font-semibold ${
                    variance > 0 ? 'text-mint-400' : 'text-coral-400'
                  }`}
                >
                  {variance > 0 ? '+' : ''}
                  {variancePercent.toFixed(1)}% WoW
                </div>
              </div>
              <div className="text-sm text-ice-500">
                {currentMetrics.currentWeek.orders} orders from{' '}
                {currentMetrics.currentWeek.checkouts} checkouts
              </div>
            </div>

            <div>
              <div className="text-sm text-ice-400 mb-2">Gate Thresholds</div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 rounded bg-ocean-900/30">
                  <span className="text-ice-300">Critical Threshold</span>
                  <span className="font-mono text-coral-400">&lt; 2%</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-ocean-900/30">
                  <span className="text-ice-300">Consecutive Days</span>
                  <span className="font-mono text-yellow-400">
                    3 business days
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-ocean-900/30">
                  <span className="text-ice-300">WoW Variance Alert</span>
                  <span className="font-mono text-yellow-400">±10%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            7-Day Conversion Rate Trend
          </h2>

          <div className="space-y-3">
            {currentMetrics.dailyTrend.map((day, index) => {
              const isCritical = day.conversionRate < 2
              const maxCheckouts = Math.max(
                ...currentMetrics.dailyTrend.map((d) => d.checkouts),
              )
              const barWidth = (day.checkouts / maxCheckouts) * 100

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-ice-400">
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-ice-500">
                        {day.orders}/{day.checkouts}
                      </div>
                      <div
                        className={`font-semibold ${
                          isCritical ? 'text-coral-400' : 'text-ice-200'
                        }`}
                      >
                        {day.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="h-8 bg-ice-900/30 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full transition-all ${
                        isCritical
                          ? 'bg-gradient-to-r from-coral-600 to-coral-500'
                          : 'bg-gradient-to-r from-mint-600 to-mint-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                      {day.checkouts} checkouts
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="metric-card">
            <div className="text-ice-400 text-sm mb-2">
              Average Order Value
            </div>
            <div className="text-2xl font-bold text-ice-50 mb-1">
              ${currentMetrics.currentWeek.averageOrderValue.toFixed(2)}
            </div>
            <div className="text-xs text-ice-500">This week</div>
          </div>

          <div className="metric-card">
            <div className="text-ice-400 text-sm mb-2">Total Orders</div>
            <div className="text-2xl font-bold text-ice-50 mb-1">
              {currentMetrics.currentWeek.orders}
            </div>
            <div className="text-xs text-ice-500">Last 7 days</div>
          </div>

          <div className="metric-card">
            <div className="text-ice-400 text-sm mb-2">Consecutive Low Days</div>
            <div className="text-2xl font-bold text-ice-50 mb-1">
              {currentMetrics.consecutiveLowDays}
            </div>
            <div className="text-xs text-ice-500">
              CR &lt; 2% (Triggers at 3)
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Why This Matters
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-ocean-900/30 border border-ice-800/30">
              <div className="w-8 h-8 rounded-full bg-mint-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-mint-400 text-lg">💰</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-ice-200 mb-1">
                  Stable funnel = safe to scale
                </div>
                <div className="text-sm text-ice-400">
                  If CR stays above 2% with low variance, you can confidently
                  increase ad spend without wasting money on a broken funnel.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-ocean-900/30 border border-ice-800/30">
              <div className="w-8 h-8 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-coral-400 text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-ice-200 mb-1">
                  Low CR = fix before spending
                </div>
                <div className="text-sm text-ice-400">
                  If CR drops below 2% for 3+ days, there's likely a funnel
                  issue (pricing, UX, trust). Fix it before scaling traffic.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-ocean-900/30 border border-ice-800/30">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-400 text-lg">📊</span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-ice-200 mb-1">
                  Watch WoW variance
                </div>
                <div className="text-sm text-ice-400">
                  If CR swings ±10% week-over-week, investigate what changed
                  (traffic quality, product availability, site issues).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Phase */}
        <div className="glass-card p-6 bg-gradient-to-r from-ocean-900/50 to-ocean-800/30 border-2 border-ocean-600/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-ocean-400 font-semibold mb-1">
                NEXT PHASE
              </div>
              <div className="text-lg font-semibold text-ice-200 mb-2">
                Phase 3: CRO Review
              </div>
              <div className="text-sm text-ice-400">
                Unlocks when funnel throughput is stable for 7 consecutive days
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-ice-800 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-ice-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
