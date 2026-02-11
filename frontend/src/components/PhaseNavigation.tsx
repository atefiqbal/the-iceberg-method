'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Phase {
  phase: string
  status: 'locked' | 'current' | 'completed'
  name: string
  description: string
  completedAt?: string
  unlocked: boolean
}

const phaseEmojis: Record<string, string> = {
  deliverability: '📧',
  core_flows: '🔄',
  segmentation: '🎯',
  conversion_measurement: '📊',
  cro_observation: '🔍',
  revenue_activation: '💰',
  offer_construction: '🎁',
  paid_acquisition: '🚀',
}

const phaseUrls: Record<string, string> = {
  deliverability: '/dashboard/deliverability',
  core_flows: '/dashboard/core-flows',
  segmentation: '/dashboard/segmentation',
  conversion_measurement: '/dashboard/conversion-measurement',
  cro_observation: '/dashboard/cro-review',
  revenue_activation: '/dashboard/revenue-activation',
  offer_construction: '/dashboard/offer-construction',
  paid_acquisition: '/dashboard/paid-acquisition',
}

export default function PhaseNavigation() {
  const [phases, setPhases] = useState<Phase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPhases()
  }, [])

  const fetchPhases = async () => {
    try {
      // Get token from localStorage, or fetch dev token if not present
      let token = localStorage.getItem('auth_token')

      if (!token) {
        // Try to get dev token from backend (development only)
        try {
          const devTokenResponse = await fetch('http://localhost:3000/auth/dev-token')
          if (devTokenResponse.ok) {
            const devData = await devTokenResponse.json()
            if (devData.accessToken) {
              token = devData.accessToken
              // Save for next time
              localStorage.setItem('auth_token', token)
              console.log('✅ Development token obtained automatically')
            }
          }
        } catch (devTokenError) {
          console.warn('Could not fetch dev token:', devTokenError)
        }
      }

      // Fallback to mock token if still no token (will likely fail)
      if (!token) {
        token = 'mock-jwt-token'
      }

      const response = await fetch('/api/phases', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch phases: ${response.status}`)
      }

      const data = await response.json()
      setPhases(data)
    } catch (err) {
      console.error('Error fetching phases:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-8 mb-12">
        <h2 className="text-2xl font-display font-bold mb-6">The 8-Phase Sequence</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-ice-900/20 border border-ice-800/30 animate-pulse"
            >
              <div className="h-20"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card p-8 mb-12 border-2 border-red-500/50">
        <h2 className="text-2xl font-display font-bold mb-4">The 8-Phase Sequence</h2>
        <p className="text-red-400">Error loading phases: {error}</p>
        <button
          onClick={fetchPhases}
          className="mt-4 px-4 py-2 bg-ocean-600 text-white rounded-lg hover:bg-ocean-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="glass-card p-8 mb-12">
      <h2 className="text-2xl font-display font-bold mb-6">The 8-Phase Sequence</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {phases.map((phase, index) => {
          const emoji = phaseEmojis[phase.phase] || '📍'
          const url = phaseUrls[phase.phase]
          const phaseNumber = index + 1

          // Completed phase
          if (phase.status === 'completed') {
            return (
              <Link
                key={phase.phase}
                href={url}
                className="p-4 rounded-lg bg-mint-600/20 border-2 border-mint-500 hover:bg-mint-600/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-mint-400">
                    PHASE {phaseNumber}
                  </span>
                  <svg
                    className="w-5 h-5 text-mint-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-ice-200 mb-1 group-hover:text-mint-300 transition-colors">
                  {emoji} {phase.name}
                </h3>
                <p className="text-xs text-ice-500">{phase.description}</p>
              </Link>
            )
          }

          // Current phase
          if (phase.status === 'current') {
            return (
              <Link
                key={phase.phase}
                href={url}
                className="p-4 rounded-lg bg-ocean-600/20 border-2 border-ocean-500 hover:bg-ocean-600/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ocean-400">
                    PHASE {phaseNumber}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-mint-500 animate-pulse" />
                </div>
                <h3 className="font-semibold text-ice-200 mb-1 group-hover:text-ocean-300 transition-colors">
                  {emoji} {phase.name}
                </h3>
                <p className="text-xs text-ice-500">{phase.description}</p>
              </Link>
            )
          }

          // Locked phase
          return (
            <div
              key={phase.phase}
              className="p-4 rounded-lg bg-ice-900/20 border border-ice-800/30 opacity-50 cursor-not-allowed"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ice-600">
                  PHASE {phaseNumber}
                </span>
                <svg className="w-4 h-4 text-ice-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-ice-600 mb-1">
                {emoji} {phase.name}
              </h3>
              <p className="text-xs text-ice-700">{phase.description}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
