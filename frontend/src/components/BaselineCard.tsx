'use client'

import { useState, useEffect } from 'react'

interface Baseline {
  baselineByDow: Record<string, number>
  calculatedAt: string
  lookbackDays: number
  dataPointsUsed: number
  isProvisional: boolean
  anomaliesExcluded: number
}

interface BaselineComparison {
  date: string
  actualRevenue: number
  expectedRevenue: number
  lift: number
  isProvisional: boolean
}

export default function BaselineCard() {
  const [baseline, setBaseline] = useState<Baseline | null>(null)
  const [comparison, setComparison] = useState<BaselineComparison | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBaselineData()
    const interval = setInterval(fetchBaselineData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchBaselineData = async () => {
    try {
      const [baselineRes, comparisonRes] = await Promise.all([
        fetch('/api/metrics/baseline'),
        fetch('/api/metrics/baseline/compare'),
      ])

      if (baselineRes.ok) {
        const baselineData = await baselineRes.json()
        setBaseline(baselineData)
      }

      if (comparisonRes.ok) {
        const comparisonData = await comparisonRes.json()
        setComparison(comparisonData)
      }
    } catch (error) {
      console.error('Failed to fetch baseline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const recalculateBaseline = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/metrics/baseline', {
        method: 'POST',
      })

      if (response.ok) {
        await fetchBaselineData()
        alert('Baseline recalculated successfully!')
      } else {
        alert('Failed to recalculate baseline')
      }
    } catch (error) {
      console.error('Failed to recalculate baseline:', error)
      alert('Failed to recalculate baseline')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="metric-card opacity-50 cursor-not-allowed">
        <div className="flex items-center justify-between mb-4">
          <span className="text-ice-400 text-sm">Baseline</span>
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
    )
  }

  if (!baseline || !comparison) {
    return (
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-ice-400 text-sm">Baseline</span>
          <span className="text-xs text-red-400">No Data</span>
        </div>
        <p className="text-3xl font-display font-bold text-ice-700 mb-2">--</p>
        <p className="text-sm text-ice-600">
          Import historical data to calculate baseline
        </p>
        <button
          onClick={recalculateBaseline}
          className="mt-3 text-xs text-ocean-400 hover:text-ocean-300 underline"
        >
          Calculate Now
        </button>
      </div>
    )
  }

  const liftColor =
    comparison.lift > 0
      ? 'text-mint-400'
      : comparison.lift < -10
        ? 'text-red-400'
        : 'text-yellow-400'

  const liftIcon =
    comparison.lift > 0
      ? '↑'
      : comparison.lift < -10
        ? '↓'
        : '→'

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-ice-400 text-sm">Today vs Baseline</span>
        {baseline.isProvisional && (
          <span className="text-xs text-yellow-400 px-2 py-1 bg-yellow-400/10 rounded">
            Provisional
          </span>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-display font-bold gradient-text">
            ${comparison.actualRevenue.toLocaleString()}
          </p>
          <span className={`text-lg font-semibold ${liftColor}`}>
            {liftIcon} {Math.abs(comparison.lift).toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-ice-500 mt-1">
          Expected: ${comparison.expectedRevenue.toLocaleString()}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-ice-500 pt-3 border-t border-ice-800/30">
        <span>
          {baseline.dataPointsUsed} days of data
        </span>
        <button
          onClick={recalculateBaseline}
          className="text-ocean-400 hover:text-ocean-300 underline"
        >
          Recalculate
        </button>
      </div>
    </div>
  )
}
