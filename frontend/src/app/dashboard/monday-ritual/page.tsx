'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface WeeklyReport {
  weekEnding: string
  baseline: {
    expected: number
    actual: number
    variance: number
    variancePercent: number
  }
  postPurchase: {
    revenue: number
    percentage: number
    trend: 'up' | 'down' | 'flat'
    changePercent: number
  }
  gates: {
    deliverability: 'pass' | 'warning' | 'fail' | 'grace_period'
    funnelThroughput: 'pass' | 'warning' | 'fail'
    croReview: 'pass' | 'locked'
  }
  alerts: Array<{
    type: 'critical' | 'warning' | 'info'
    title: string
    message: string
  }>
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    title: string
    description: string
    estimatedImpact: string
  }>
}

export default function MondayRitualPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchWeeklyReport()
  }, [])

  async function fetchWeeklyReport() {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/reports/weekly')
      if (response.ok) {
        const data = await response.json()
        setReport(data)
      }
    } catch (error) {
      console.error('Failed to fetch weekly report:', error)
    } finally {
      setLoading(false)
    }
  }

  async function exportPdf() {
    try {
      setExporting(true)
      const response = await fetch('/api/reports/weekly/pdf')

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `monday-ritual-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export PDF')
      }
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  function getGateStatusColor(status: string): string {
    switch (status) {
      case 'pass':
        return 'text-mint-400'
      case 'warning':
        return 'text-yellow-400'
      case 'fail':
      case 'grace_period':
        return 'text-coral-400'
      case 'locked':
        return 'text-ice-600'
      default:
        return 'text-ice-400'
    }
  }

  function getGateIcon(status: string): string {
    switch (status) {
      case 'pass':
        return '✓'
      case 'warning':
        return '⚠'
      case 'fail':
      case 'grace_period':
        return '✗'
      case 'locked':
        return '🔒'
      default:
        return '—'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ocean-950 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-ice-300">Generating your weekly report...</div>
          </div>
        </div>
      </div>
    )
  }

  // Mock data for demo
  const mockReport: WeeklyReport = {
    weekEnding: new Date().toISOString(),
    baseline: {
      expected: 12450,
      actual: 13678,
      variance: 1228,
      variancePercent: 9.9,
    },
    postPurchase: {
      revenue: 4240,
      percentage: 31.0,
      trend: 'up',
      changePercent: 3.2,
    },
    gates: {
      deliverability: 'pass',
      funnelThroughput: 'pass',
      croReview: 'locked',
    },
    alerts: [
      {
        type: 'warning',
        title: 'Soft bounce rate approaching threshold',
        message:
          'Email soft bounces at 2.8% (warning at 3%). Monitor list quality.',
      },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Activate welcome sequence for new customers',
        description:
          'You have 127 customers who made their first purchase this week without entering a lifecycle flow.',
        estimatedImpact: '+$380-$510 post-purchase revenue/week',
      },
      {
        priority: 'medium',
        title: 'Review product step progression',
        description:
          '23% of customers are stuck on product step 1 beyond expected timeframe.',
        estimatedImpact: '+$180-$240 revenue/week',
      },
    ],
  }

  const currentReport = report || mockReport

  return (
    <div className="min-h-screen bg-ocean-950 p-8">
      <div className="max-w-5xl mx-auto space-y-8 monday-ritual-content">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ice-50 mb-2">
              Monday Ritual
            </h1>
            <p className="text-ice-400">
              Week ending {new Date(currentReport.weekEnding).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportPdf}
              disabled={exporting}
              className="px-4 py-2 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? '⏳ Generating...' : '📄 Export PDF'}
            </button>
            <button className="px-4 py-2 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors">
              📧 Email Report
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Executive Summary
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Baseline Performance */}
            <div>
              <div className="text-sm text-ice-400 mb-2">
                Baseline Performance
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-3xl font-bold text-ice-50">
                  ${currentReport.baseline.actual.toLocaleString()}
                </div>
                <div
                  className={`text-sm font-semibold ${
                    currentReport.baseline.variance > 0
                      ? 'text-mint-400'
                      : 'text-coral-400'
                  }`}
                >
                  {currentReport.baseline.variance > 0 ? '+' : ''}
                  {currentReport.baseline.variancePercent.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-ice-500">
                Expected: ${currentReport.baseline.expected.toLocaleString()} |
                Variance: $
                {Math.abs(currentReport.baseline.variance).toLocaleString()}
              </div>
              <div className="mt-3 h-2 bg-ice-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-mint-600 to-mint-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (currentReport.baseline.actual /
                        currentReport.baseline.expected) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Post-Purchase Revenue */}
            <div>
              <div className="text-sm text-ice-400 mb-2">
                Post-Purchase Revenue
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-3xl font-bold text-ice-50">
                  {currentReport.postPurchase.percentage.toFixed(1)}%
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-mint-400">
                  {currentReport.postPurchase.trend === 'up' ? '↑' : '↓'}
                  {Math.abs(currentReport.postPurchase.changePercent).toFixed(
                    1,
                  )}
                  %
                </div>
              </div>
              <div className="text-sm text-ice-500">
                ${currentReport.postPurchase.revenue.toLocaleString()} from
                lifecycle flows
              </div>
              <div className="mt-3 h-2 bg-ice-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ocean-600 to-ocean-500"
                  style={{
                    width: `${currentReport.postPurchase.percentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gate Status */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Gate Status
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-ocean-900/30 border border-ice-800/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-ice-400">Deliverability</div>
                <div
                  className={`text-2xl ${getGateStatusColor(
                    currentReport.gates.deliverability,
                  )}`}
                >
                  {getGateIcon(currentReport.gates.deliverability)}
                </div>
              </div>
              <div className="text-sm text-ice-300 capitalize">
                {currentReport.gates.deliverability.replace('_', ' ')}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-ocean-900/30 border border-ice-800/30">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-ice-400">Funnel Throughput</div>
                <div
                  className={`text-2xl ${getGateStatusColor(
                    currentReport.gates.funnelThroughput,
                  )}`}
                >
                  {getGateIcon(currentReport.gates.funnelThroughput)}
                </div>
              </div>
              <div className="text-sm text-ice-300 capitalize">
                {currentReport.gates.funnelThroughput}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-ocean-900/30 border border-ice-800/30 opacity-50">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-ice-600">CRO Review</div>
                <div className="text-2xl text-ice-600">
                  {getGateIcon(currentReport.gates.croReview)}
                </div>
              </div>
              <div className="text-sm text-ice-600 capitalize">
                {currentReport.gates.croReview}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {currentReport.alerts.length > 0 && (
          <div className="glass-card p-8">
            <h2 className="text-xl font-semibold text-ice-50 mb-6">
              This Week's Alerts
            </h2>

            <div className="space-y-4">
              {currentReport.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    alert.type === 'critical'
                      ? 'bg-coral-500/10 border-coral-500/30'
                      : alert.type === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-ocean-500/10 border-ocean-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        alert.type === 'critical'
                          ? 'bg-coral-500/20 text-coral-400'
                          : alert.type === 'warning'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-ocean-500/20 text-ocean-400'
                      }`}
                    >
                      {alert.type === 'critical' ? '!' : alert.type === 'warning' ? '⚠' : 'i'}
                    </div>
                    <div className="flex-1">
                      <div
                        className={`font-medium mb-1 ${
                          alert.type === 'critical'
                            ? 'text-coral-300'
                            : alert.type === 'warning'
                              ? 'text-yellow-300'
                              : 'text-ocean-300'
                        }`}
                      >
                        {alert.title}
                      </div>
                      <div className="text-sm text-ice-400">
                        {alert.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Recommended Actions
          </h2>

          <div className="space-y-4">
            {currentReport.recommendations.map((rec, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-ocean-900/30 border border-ice-800/30 hover:bg-ocean-900/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        rec.priority === 'high'
                          ? 'bg-coral-500/20 text-coral-400'
                          : rec.priority === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-ice-500/20 text-ice-400'
                      }`}
                    >
                      {rec.priority.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-ice-200 mb-1">
                        {rec.title}
                      </div>
                      <div className="text-sm text-ice-400 mb-2">
                        {rec.description}
                      </div>
                      <div className="text-sm text-mint-400 font-medium">
                        💰 {rec.estimatedImpact}
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-mint-600 text-white text-sm font-medium hover:bg-mint-700 transition-colors flex-shrink-0">
                    Take Action
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meeting Agenda */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Suggested Meeting Agenda
          </h2>

          <div className="space-y-3">
            {[
              {
                time: '2 min',
                topic: 'Review baseline performance vs target',
                details: `Actual: $${currentReport.baseline.actual.toLocaleString()} (${currentReport.baseline.variance > 0 ? '+' : ''}${currentReport.baseline.variancePercent.toFixed(1)}%)`,
              },
              {
                time: '3 min',
                topic: 'Post-purchase revenue deep-dive',
                details: `${currentReport.postPurchase.percentage.toFixed(1)}% of revenue from lifecycle flows`,
              },
              {
                time: '5 min',
                topic: 'Action on high-priority recommendations',
                details: `${currentReport.recommendations.filter((r) => r.priority === 'high').length} high-priority items`,
              },
              {
                time: '2 min',
                topic: 'Gate status and blockers',
                details: 'Review any failed gates or upcoming risks',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 rounded-lg bg-ocean-900/20"
              >
                <div className="w-16 text-sm font-mono text-ice-500 flex-shrink-0">
                  {item.time}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-ice-200 mb-1">
                    {item.topic}
                  </div>
                  <div className="text-sm text-ice-500">{item.details}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-ice-800/50 text-center">
            <div className="text-sm text-ice-500">
              Total meeting time: ~12 minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
