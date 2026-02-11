'use client'

import Link from 'next/link'

export default function PaidAcquisitionPage() {
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
          <span className="text-ice-300">Paid Acquisition</span>
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
                  PHASE 8
                </span>
                <span className="px-3 py-1 bg-ice-900/40 border border-ice-700 rounded-full text-xs font-semibold text-ice-400">
                  🔒 LOCKED
                </span>
              </div>
              <h1 className="text-4xl font-display font-bold gradient-text">
                🚀 Paid Acquisition
              </h1>
              <p className="text-ice-400 text-lg max-w-3xl">
                Scale with confidence once all gates pass. Add new customers to your proven lifecycle machine without breaking unit economics.
              </p>
            </div>
          </div>
        </div>

        {/* Composite Gate Requirements */}
        <div className="glass-card p-6 mb-8 border-2 border-amber-500/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-300 mb-3">All Gates Must Pass to Unlock</h3>
              <p className="text-ice-400 mb-4">
                Paid acquisition requires passing all prerequisite gates to ensure profitable scaling.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-ice-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-ice-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-ice-300 font-medium">Deliverability Gate</p>
                    <p className="text-sm text-ice-500">Status: <span className="text-ice-600">Not Passing</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-ice-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-ice-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-ice-300 font-medium">Funnel Throughput Gate</p>
                    <p className="text-sm text-ice-500">Status: <span className="text-ice-600">Not Passing</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-ice-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-ice-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-ice-300 font-medium">Offer Margin Validated</p>
                    <p className="text-sm text-ice-500">Status: <span className="text-ice-600">Not Validated</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-ice-900/30 rounded-lg">
                  <svg className="w-5 h-5 text-ice-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-ice-300 font-medium">Post-Purchase Revenue ≥20%</p>
                    <p className="text-sm text-ice-500">Current: <span className="text-ice-600">0%</span></p>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="inline-block mt-4 px-6 py-2 bg-ocean-600 text-white font-medium rounded-lg hover:bg-ocean-700 transition-colors"
              >
                Complete Earlier Phases →
              </Link>
            </div>
          </div>
        </div>

        {/* Preview Content (Locked) */}
        <div className="glass-card p-8 opacity-60 pointer-events-none">
          <h2 className="text-2xl font-display font-bold mb-6">Scaling Readiness</h2>

          {/* Readiness Dashboard */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-ice-200 mb-4">Unit Economics</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">AOV (Average Order Value)</span>
                  <span className="text-ice-200 font-medium">$0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">Customer LTV (90d)</span>
                  <span className="text-ice-200 font-medium">$0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">Target CPA</span>
                  <span className="text-ice-200 font-medium">$0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">Margin Buffer</span>
                  <span className="text-ice-200 font-medium">0%</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold text-ice-200 mb-4">Lifecycle Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">Email Revenue %</span>
                  <span className="text-ice-200 font-medium">0%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">Cart Recovery Rate</span>
                  <span className="text-ice-200 font-medium">0%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">Reactivation RPR</span>
                  <span className="text-ice-200 font-medium">$0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ice-400">Repeat Purchase Rate</span>
                  <span className="text-ice-200 font-medium">0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scaling Strategy */}
          <div className="glass-card p-6 border border-ice-800/30">
            <h3 className="text-xl font-semibold mb-4">Recommended Scaling Strategy</h3>
            <p className="text-ice-400 mb-6">
              Once all gates pass, your lifecycle machine is ready to profitably acquire new customers.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-ice-900/20 rounded-lg">
                <h4 className="text-ice-200 font-medium mb-2">Week 1-2: Test Channels</h4>
                <p className="text-sm text-ice-400">
                  Start with $500/day across Meta, Google Shopping, and TikTok. Monitor ROAS and CPA against targets.
                </p>
              </div>

              <div className="p-4 bg-ice-900/20 rounded-lg">
                <h4 className="text-ice-200 font-medium mb-2">Week 3-4: Scale Winners</h4>
                <p className="text-sm text-ice-400">
                  2x budget on channels hitting ROAS targets. Maintain deliverability monitoring.
                </p>
              </div>

              <div className="p-4 bg-ice-900/20 rounded-lg">
                <h4 className="text-ice-200 font-medium mb-2">Week 5+: Sustained Growth</h4>
                <p className="text-sm text-ice-400">
                  Continue scaling while watching for funnel degradation. Lifecycle flows maximize LTV of acquired customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
