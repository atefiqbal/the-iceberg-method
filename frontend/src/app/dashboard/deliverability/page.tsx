'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Shield, XCircle } from 'lucide-react'

interface DeliverabilityMetrics {
  hardBounceRate: number
  softBounceRate: number
  spamComplaintRate: number
  totalSent: number
  period: {
    start: string
    end: string
  }
}

interface GateStatus {
  status: 'pass' | 'warning' | 'grace_period' | 'fail'
  message: string
  blockedFeatures: string[]
  gracePeriodEndsAt?: string
  failedAt?: string
  canOverride: boolean
  overrideWarning?: string
  metrics?: DeliverabilityMetrics
}

interface KlaviyoStatus {
  connected: boolean
  status?: string
  lastSyncAt?: string
}

export default function DeliverabilityPage() {
  const [gateStatus, setGateStatus] = useState<GateStatus | null>(null)
  const [klaviyoStatus, setKlaviyoStatus] = useState<KlaviyoStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [gracePeriodRemaining, setGracePeriodRemaining] = useState<string>('')
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (gateStatus?.gracePeriodEndsAt) {
      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [gateStatus?.gracePeriodEndsAt])

  const fetchData = async () => {
    try {
      const [gateRes, klaviyoRes] = await Promise.all([
        fetch('/api/gates/deliverability'),
        fetch('/api/integrations/klaviyo'),
      ])

      if (gateRes.ok) {
        const gateData = await gateRes.json()
        setGateStatus(gateData)
      }

      if (klaviyoRes.ok) {
        const klaviyoData = await klaviyoRes.json()
        setKlaviyoStatus(klaviyoData)
      }
    } catch (error) {
      console.error('Failed to fetch deliverability data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCountdown = () => {
    if (!gateStatus?.gracePeriodEndsAt) return

    const now = new Date().getTime()
    const end = new Date(gateStatus.gracePeriodEndsAt).getTime()
    const remaining = end - now

    if (remaining <= 0) {
      setGracePeriodRemaining('EXPIRED')
      return
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

    setGracePeriodRemaining(`${hours}h ${minutes}m ${seconds}s`)
  }

  const handleOverride = async () => {
    if (!overrideReason.trim()) {
      alert('Override reason required')
      return
    }

    try {
      const res = await fetch('/api/gates/deliverability/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: overrideReason }),
      })

      if (res.ok) {
        setShowOverrideModal(false)
        setOverrideReason('')
        fetchData()
      }
    } catch (error) {
      console.error('Override failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-[#E8F4F8] font-mono">Loading diagnostic data...</div>
      </div>
    )
  }

  const statusConfig = {
    pass: {
      color: '#4ECDC4',
      bgColor: 'rgba(78, 205, 196, 0.1)',
      borderColor: 'rgba(78, 205, 196, 0.3)',
      icon: CheckCircle2,
      label: 'PASS',
    },
    warning: {
      color: '#FFB84D',
      bgColor: 'rgba(255, 184, 77, 0.1)',
      borderColor: 'rgba(255, 184, 77, 0.3)',
      icon: AlertTriangle,
      label: 'WARNING',
    },
    grace_period: {
      color: '#FF6B6B',
      bgColor: 'rgba(255, 107, 107, 0.1)',
      borderColor: 'rgba(255, 107, 107, 0.3)',
      icon: Clock,
      label: 'GRACE PERIOD',
    },
    fail: {
      color: '#FF4757',
      bgColor: 'rgba(255, 71, 87, 0.1)',
      borderColor: 'rgba(255, 71, 87, 0.3)',
      icon: XCircle,
      label: 'FAIL',
    },
  }

  const currentStatus = gateStatus?.status || 'pass'
  const config = statusConfig[currentStatus]
  const StatusIcon = config.icon

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#E8F4F8] p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-[#4ECDC4]" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Phase 1: Deliverability
          </h1>
        </div>
        <p className="text-[#8B9BAB] text-sm">
          Monitor sender reputation. Block promotions if thresholds violated.
        </p>
      </div>

      {/* Alert Banner */}
      {gateStatus && (currentStatus === 'fail' || currentStatus === 'grace_period') && (
        <div
          className="mb-6 p-4 rounded-lg border-2 animate-pulse-slow"
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
          }}
        >
          <div className="flex items-start gap-3">
            <StatusIcon className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: config.color }} />
            <div className="flex-1">
              <div className="font-bold mb-1" style={{ color: config.color }}>
                {currentStatus === 'fail' ? 'CRITICAL: ' : 'WARNING: '}
                {gateStatus.message}
              </div>
              {gateStatus.blockedFeatures.length > 0 && (
                <div className="text-sm text-[#E8F4F8] opacity-80">
                  Blocked: {gateStatus.blockedFeatures.join(', ')}
                </div>
              )}
              {currentStatus === 'grace_period' && gracePeriodRemaining && (
                <div className="mt-2 text-sm font-mono" style={{ color: config.color }}>
                  Grace period expires in: {gracePeriodRemaining}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gate Status Panel */}
      <div
        className="mb-6 p-6 rounded-lg border backdrop-blur-xl"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          boxShadow: `0 0 30px ${config.borderColor}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <StatusIcon className="w-12 h-12" style={{ color: config.color }} />
            <div>
              <div className="text-sm text-[#8B9BAB] uppercase tracking-wider mb-1">
                Deliverability Gate
              </div>
              <div className="text-3xl font-bold" style={{ color: config.color }}>
                {config.label}
              </div>
            </div>
          </div>

          {gateStatus?.canOverride && currentStatus === 'fail' && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="px-4 py-2 bg-[#1E3A5F] border border-[#FF6B6B] text-[#FF6B6B] rounded hover:bg-[#FF6B6B] hover:text-white transition-all"
            >
              Override Gate
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      {gateStatus?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <MetricCard
            label="Hard Bounce Rate"
            value={gateStatus.metrics.hardBounceRate}
            threshold={0.005}
            unit="%"
            status={gateStatus.metrics.hardBounceRate <= 0.005 ? 'pass' : 'fail'}
          />
          <MetricCard
            label="Soft Bounce Rate"
            value={gateStatus.metrics.softBounceRate}
            threshold={0.05}
            warningThreshold={0.03}
            unit="%"
            status={
              gateStatus.metrics.softBounceRate >= 0.05
                ? 'fail'
                : gateStatus.metrics.softBounceRate >= 0.03
                  ? 'warning'
                  : 'pass'
            }
          />
          <MetricCard
            label="Spam Complaint Rate"
            value={gateStatus.metrics.spamComplaintRate}
            threshold={0.001}
            unit="%"
            status={gateStatus.metrics.spamComplaintRate <= 0.001 ? 'pass' : 'fail'}
          />
        </div>
      )}

      {/* Klaviyo Connection Status */}
      <div className="bg-[#1E3A5F]/30 backdrop-blur-xl border border-[#2A4A6F] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-[#8B9BAB] uppercase tracking-wider mb-2">
              ESP Integration
            </div>
            <div className="text-xl font-bold">
              Klaviyo:{' '}
              <span
                style={{
                  color: klaviyoStatus?.connected ? '#4ECDC4' : '#8B9BAB',
                }}
              >
                {klaviyoStatus?.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {klaviyoStatus?.lastSyncAt && (
              <div className="text-sm text-[#8B9BAB] mt-1">
                Last sync: {new Date(klaviyoStatus.lastSyncAt).toLocaleString()}
              </div>
            )}
          </div>

          {!klaviyoStatus?.connected && (
            <button className="px-6 py-3 bg-[#4ECDC4] text-[#0A1628] font-bold rounded hover:bg-[#3DBDB5] transition-all">
              Connect Klaviyo
            </button>
          )}
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1E3A5F] border-2 border-[#FF6B6B] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-[#FF6B6B] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-[#FF6B6B] mb-2">Override Gate</h3>
                <p className="text-[#E8F4F8] text-sm">{gateStatus?.overrideWarning}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#8B9BAB] mb-2">
                Reason for override (required):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full bg-[#0A1628] border border-[#2A4A6F] rounded px-3 py-2 text-[#E8F4F8] focus:border-[#4ECDC4] focus:outline-none"
                rows={3}
                placeholder="Explain why you're overriding this gate..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOverrideModal(false)
                  setOverrideReason('')
                }}
                className="flex-1 px-4 py-2 bg-[#2A4A6F] text-[#E8F4F8] rounded hover:bg-[#3A5A7F] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!overrideReason.trim()}
                className="flex-1 px-4 py-2 bg-[#FF6B6B] text-white font-bold rounded hover:bg-[#FF5252] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Override & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: number
  threshold: number
  warningThreshold?: number
  unit: string
  status: 'pass' | 'warning' | 'fail'
}

function MetricCard({
  label,
  value,
  threshold,
  warningThreshold,
  unit,
  status,
}: MetricCardProps) {
  const statusColors = {
    pass: '#4ECDC4',
    warning: '#FFB84D',
    fail: '#FF6B6B',
  }

  const displayValue = (value * 100).toFixed(3)
  const thresholdDisplay = (threshold * 100).toFixed(1)
  const warningDisplay = warningThreshold ? (warningThreshold * 100).toFixed(1) : null

  return (
    <div className="bg-[#1E3A5F]/30 backdrop-blur-xl border border-[#2A4A6F] rounded-lg p-4">
      <div className="text-sm text-[#8B9BAB] uppercase tracking-wider mb-3">{label}</div>

      <div className="flex items-baseline gap-2 mb-3">
        <div
          className="text-4xl font-bold font-mono"
          style={{ color: statusColors[status] }}
        >
          {displayValue}
        </div>
        <div className="text-lg text-[#8B9BAB]">{unit}</div>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#8B9BAB]">Threshold:</span>
          <span className="text-[#E8F4F8] font-mono">≤{thresholdDisplay}%</span>
        </div>
        {warningDisplay && (
          <div className="flex items-center justify-between">
            <span className="text-[#8B9BAB]">Warning:</span>
            <span className="text-[#FFB84D] font-mono">≥{warningDisplay}%</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[#8B9BAB]">Status:</span>
          <span className="font-bold uppercase" style={{ color: statusColors[status] }}>
            {status}
          </span>
        </div>
      </div>

      {/* Visual Threshold Bar */}
      <div className="mt-3 h-2 bg-[#0A1628] rounded-full overflow-hidden relative">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min((value / threshold) * 100, 100)}%`,
            backgroundColor: statusColors[status],
          }}
        />
        {warningThreshold && (
          <div
            className="absolute top-0 h-full w-0.5 bg-[#FFB84D]"
            style={{
              left: `${(warningThreshold / threshold) * 100}%`,
            }}
          />
        )}
      </div>
    </div>
  )
}
