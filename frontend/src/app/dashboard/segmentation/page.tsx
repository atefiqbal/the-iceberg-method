'use client'

import Link from 'next/link'

export default function SegmentationPage() {
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
          <span className="text-ice-300">Segmentation</span>
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
                  PHASE 3
                </span>
                <span className="px-3 py-1 bg-ice-900/40 border border-ice-700 rounded-full text-xs font-semibold text-ice-400">
                  🔒 LOCKED
                </span>
              </div>
              <h1 className="text-4xl font-display font-bold gradient-text">
                👥 Customer Segmentation
              </h1>
              <p className="text-ice-400 text-lg max-w-3xl">
                Map your customer journey with intelligent segmentation: pre/post-purchase tracking, product ladder progression, and reactivation windows.
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
              <h3 className="font-semibold text-amber-300 mb-2">Complete Phase 2 to Unlock</h3>
              <p className="text-ice-400 mb-4">
                Segmentation builds on your lifecycle flows to enable personalized messaging based on customer journey stage.
              </p>
              <Link
                href="/dashboard/core-flows"
                className="inline-block mt-2 px-6 py-2 bg-ocean-600 text-white font-medium rounded-lg hover:bg-ocean-700 transition-colors"
              >
                Go to Core Flows →
              </Link>
            </div>
          </div>
        </div>

        {/* Preview Content (Locked) */}
        <div className="glass-card p-8 opacity-60 pointer-events-none">
          <h2 className="text-2xl font-display font-bold mb-6">Segment Overview</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Pre/Post Purchase */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-ice-200 mb-2">Pre/Post-Purchase</h3>
              <div className="text-3xl font-bold gradient-text mb-2">0 / 0</div>
              <p className="text-sm text-ice-400">Customers who have vs. haven't purchased</p>
            </div>

            {/* Product Ladder */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-ice-200 mb-2">Product Progression</h3>
              <div className="text-3xl font-bold gradient-text mb-2">0</div>
              <p className="text-sm text-ice-400">Customers on product ladder</p>
            </div>

            {/* Reactivation */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-ice-200 mb-2">Reactivation Window</h3>
              <div className="text-3xl font-bold gradient-text mb-2">90 days</div>
              <p className="text-sm text-ice-400">Auto-calculated from purchase behavior</p>
            </div>
          </div>

          {/* Product Ladder Configuration */}
          <div className="glass-card p-6 border border-ice-800/30">
            <h3 className="text-xl font-semibold mb-4">Product Ladder Configuration</h3>
            <p className="text-sm text-ice-400 mb-4">
              Define your product progression from entry to premium to enable smart cross-sell messaging.
            </p>
            <div className="space-y-3">
              <div className="p-4 bg-ice-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-ice-300">Step 1: Entry Products</span>
                  <span className="text-xs text-ice-500">Not configured</span>
                </div>
              </div>
              <div className="p-4 bg-ice-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-ice-300">Step 2: Mid-Tier Products</span>
                  <span className="text-xs text-ice-500">Not configured</span>
                </div>
              </div>
              <div className="p-4 bg-ice-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-ice-300">Step 3: Premium Products</span>
                  <span className="text-xs text-ice-500">Not configured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
