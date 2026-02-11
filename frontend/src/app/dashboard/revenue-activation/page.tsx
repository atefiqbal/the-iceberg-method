'use client'

import Link from 'next/link'

export default function RevenueActivationPage() {
  return (
    <main className="relative min-h-screen overflow-hidden noise-texture">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-ocean-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-ocean-800/30 rounded-full blur-3xl animate-float animation-delay-400" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-ice-800/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </Link>
          <span className="text-xl font-display font-bold gradient-text">The Iceberg Method</span>
          <span className="text-ice-500 mx-2">/</span>
          <span className="text-ice-300">Revenue Activation</span>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 px-8 py-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="glass-card p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-ocean-600/20 border border-ocean-600 rounded-full text-xs font-semibold text-ocean-400">
                  PHASE 6
                </span>
                <span className="px-3 py-1 bg-ice-900/40 border border-ice-700 rounded-full text-xs font-semibold text-ice-400">
                  🔒 LOCKED
                </span>
              </div>
              <h1 className="text-4xl font-display font-bold gradient-text">
                💰 Revenue Activation
              </h1>
              <p className="text-ice-400 text-lg max-w-3xl">
                Activate dormant lifecycle revenue by optimizing flow sequences, targeting high-value segments, and improving RPR across all touchpoints.
              </p>
            </div>
          </div>
        </div>

        {/* Unlock Requirements */}
        <div className="glass-card p-6 mb-8 border-2 border-amber-500/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-amber-300 mb-2">Complete Phase 5 to Unlock</h3>
              <p className="text-ice-400 mb-4">
                Revenue activation requires CRO insights and conversion tracking to identify optimization opportunities.
              </p>
              <Link
                href="/dashboard/cro-review"
                className="inline-block mt-2 px-6 py-2 bg-ocean-600 text-white font-medium rounded-lg hover:bg-ocean-700 transition-colors"
              >
                Go to CRO Review →
              </Link>
            </div>
          </div>
        </div>

        {/* Preview Content (Locked) */}
        <div className="glass-card p-8 opacity-60 pointer-events-none">
          <h2 className="text-2xl font-display font-bold mb-6">Revenue Opportunities</h2>

          {/* Opportunity Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6 border-2 border-mint-500/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-ice-200">Low-Performing Flows</h3>
                <span className="px-2 py-1 bg-mint-500/20 rounded text-xs text-mint-400">High Impact</span>
              </div>
              <p className="text-sm text-ice-400 mb-4">
                3 flows with RPR below benchmark. Optimization could unlock $12K/month.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ice-300">Welcome Series</span>
                  <span className="text-ice-500">RPR: $2.10 (target: $5.00)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ice-300">Win-Back</span>
                  <span className="text-ice-500">RPR: $1.50 (target: $3.50)</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-2 border-ocean-500/30">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-ice-200">Untapped Segments</h3>
                <span className="px-2 py-1 bg-ocean-500/20 rounded text-xs text-ocean-400">Medium Impact</span>
              </div>
              <p className="text-sm text-ice-400 mb-4">
                250 reactivation-ready customers not yet in win-back flow.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ice-300">Product Step 2 Customers</span>
                  <span className="text-ice-500">120 eligible</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ice-300">Inactive Post-Purchase</span>
                  <span className="text-ice-500">130 eligible</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activation Plan */}
          <div className="glass-card p-6 border border-ice-800/30">
            <h3 className="text-xl font-semibold mb-4">30-Day Activation Plan</h3>
            <div className="space-y-3">
              <div className="p-4 bg-ice-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-ocean-600/20 flex items-center justify-center text-ocean-400 font-semibold text-sm">
                    1
                  </div>
                  <span className="text-ice-200 font-medium">Optimize Welcome Series</span>
                </div>
                <p className="text-sm text-ice-400 ml-11">
                  A/B test subject lines, refine product recommendations, add urgency elements
                </p>
              </div>

              <div className="p-4 bg-ice-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-ocean-600/20 flex items-center justify-center text-ocean-400 font-semibold text-sm">
                    2
                  </div>
                  <span className="text-ice-200 font-medium">Activate Reactivation Segment</span>
                </div>
                <p className="text-sm text-ice-400 ml-11">
                  Launch nine-word email to 250 dormant customers
                </p>
              </div>

              <div className="p-4 bg-ice-900/20 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-ocean-600/20 flex items-center justify-center text-ocean-400 font-semibold text-sm">
                    3
                  </div>
                  <span className="text-ice-200 font-medium">Refine Product Ladder Messaging</span>
                </div>
                <p className="text-sm text-ice-400 ml-11">
                  Create step-specific cross-sell sequences for each ladder tier
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
