'use client'

import Link from 'next/link'
import NotificationCenter from '@/components/NotificationCenter'
import BaselineCard from '@/components/BaselineCard'
import RevenueChart from '@/components/RevenueChart'
import OverviewMetrics from '@/components/OverviewMetrics'
import AttributionBreakdown from '@/components/AttributionBreakdown'
import GateStatusIndicator from '@/components/GateStatusIndicator'
import PhaseNavigation from '@/components/PhaseNavigation'

export default function DashboardPage() {
  return (
    <main className="relative min-h-screen overflow-hidden noise-texture">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-ocean-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-ocean-800/30 rounded-full blur-3xl animate-float animation-delay-400" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-ice-800/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-xl font-display font-bold gradient-text">The Iceberg Method</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/dashboard/monday-ritual"
            className="px-4 py-2 rounded-lg bg-mint-600 text-white font-medium hover:bg-mint-700 transition-colors"
          >
            📊 Monday Ritual
          </Link>
          <NotificationCenter />
          <Link
            href="/dashboard/integrations"
            className="text-ice-300 hover:text-ocean-400 transition-colors font-medium"
          >
            Integrations
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-ice-300 hover:text-ocean-400 transition-colors font-medium"
          >
            Settings
          </Link>
          <button className="text-ice-300 hover:text-ocean-400 transition-colors font-medium">
            Log Out
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
        {/* Gate Status Alerts */}
        <GateStatusIndicator />

        {/* Welcome Banner */}
        <div className="glass-card p-8 mb-12">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-display font-bold gradient-text">
                Welcome to The Iceberg Method
              </h1>
              <p className="text-ice-400 text-lg">
                Your 90-day journey to ≥20% revenue lift starts now
              </p>
            </div>
            <div className="px-6 py-3 bg-ocean-600/20 border border-ocean-600 rounded-lg">
              <p className="text-xs text-ice-400 mb-1">Current Phase</p>
              <p className="text-2xl font-display font-bold gradient-text">Phase 1</p>
              <p className="text-sm text-ice-300">Deliverability</p>
            </div>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="mb-12">
          <OverviewMetrics />
        </div>

        {/* Revenue Trend Chart */}
        <div className="mb-12">
          <RevenueChart days={30} />
        </div>

        {/* Attribution Breakdown */}
        <div className="mb-12">
          <AttributionBreakdown />
        </div>

        {/* Phase Navigation */}
        <PhaseNavigation />

        {/* Next Steps */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-display font-bold mb-6">What Happens Next</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-ice-900/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-mint-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-ice-200 mb-1">1. Baseline Calculation (In Progress)</p>
                <p className="text-sm text-ice-400">
                  Analyzing 90 days of order history to establish your revenue baseline and identify current performance patterns.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border border-ice-800/30">
              <div className="w-8 h-8 rounded-full bg-ice-800 flex items-center justify-center flex-shrink-0 text-ice-500 font-semibold">
                2
              </div>
              <div>
                <p className="font-semibold text-ice-200 mb-1">2. Connect Klaviyo (Next)</p>
                <p className="text-sm text-ice-400">
                  Link your ESP to monitor deliverability health and enable lifecycle flow orchestration.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg border border-ice-800/30 opacity-50">
              <div className="w-8 h-8 rounded-full bg-ice-800 flex items-center justify-center flex-shrink-0 text-ice-500 font-semibold">
                3
              </div>
              <div>
                <p className="font-semibold text-ice-200 mb-1">3. Phase 1: Deliverability Gate</p>
                <p className="text-sm text-ice-400">
                  Review bounce rates, spam complaints, and ensure emails reach customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
