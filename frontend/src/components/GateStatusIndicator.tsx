'use client'

import { useState, useEffect } from 'react'

interface GateState {
  gateType: string
  status: 'pass' | 'warning' | 'fail' | 'grace_period'
  message?: string
  blockedFeatures?: string[]
  gracePeriodEndsAt?: string
  failedAt?: string
  metrics?: Record<string, number>
}

export default function GateStatusIndicator() {
  const [gates, setGates] = useState<GateState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGateStatus()
    const interval = setInterval(fetchGateStatus, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchGateStatus = async () => {
    try {
      const response = await fetch('/api/gates')

      if (response.ok) {
        const data = await response.json()
        setGates(data)
      }
    } catch (error) {
      console.error('Failed to fetch gate status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  // Only show gates with issues
  const problematicGates = gates.filter(
    (g) => g.status === 'fail' || g.status === 'grace_period' || g.status === 'warning'
  )

  if (problematicGates.length === 0) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fail':
        return 'bg-red-500/20 border-red-500 text-red-400'
      case 'grace_period':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
      case 'warning':
        return 'bg-orange-500/20 border-orange-500 text-orange-400'
      default:
        return 'bg-mint-500/20 border-mint-500 text-mint-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fail':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'grace_period':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )
      default:
        return null
    }
  }

  const getGateDisplayName = (gateType: string) => {
    const names: Record<string, string> = {
      deliverability: 'Deliverability',
      funnel_throughput: 'Funnel Throughput',
      cro_review: 'CRO Review',
      offer_validation: 'Offer Validation',
      paid_acquisition: 'Paid Acquisition',
    }
    return names[gateType] || gateType
  }

  return (
    <div className="mb-6">
      {problematicGates.map((gate) => (
        <div
          key={gate.gateType}
          className={`glass-card p-4 border-l-4 mb-4 ${getStatusColor(gate.status)}`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">{getStatusIcon(gate.status)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-ice-200">
                  {getGateDisplayName(gate.gateType)} Gate
                </h4>
                {gate.status === 'grace_period' && gate.gracePeriodEndsAt && (
                  <span className="text-xs px-2 py-1 bg-yellow-500/20 rounded">
                    {Math.ceil(
                      (new Date(gate.gracePeriodEndsAt).getTime() - Date.now()) /
                        (1000 * 60 * 60)
                    )}h remaining
                  </span>
                )}
              </div>
              <p className="text-sm text-ice-400 mb-2">{gate.message}</p>
              {gate.blockedFeatures && gate.blockedFeatures.length > 0 && (
                <div className="text-xs text-ice-500">
                  <span className="font-semibold">Blocked features:</span>{' '}
                  {gate.blockedFeatures.join(', ')}
                </div>
              )}
            </div>
            <a
              href={`/dashboard/gates/${gate.gateType}`}
              className="text-sm text-ocean-400 hover:text-ocean-300 underline whitespace-nowrap"
            >
              View Details →
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
