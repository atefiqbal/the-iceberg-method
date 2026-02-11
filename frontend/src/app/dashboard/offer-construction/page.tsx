'use client'

import Link from 'next/link'

export default function OfferConstructionPage() {
  return (
    <main className="relative min-h-screen overflow-hidden noise-texture">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-ocean-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-ocean-800/30 rounded-full blur-3xl animate-float animation-delay-400" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-ice-800/30 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </Link>
          <span className="text-xl font-display font-bold gradient-text">The Iceberg Method</span>
          <span className="text-ice-500 mx-2">/</span>
          <span className="text-ice-300">Offer Construction</span>
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
                  PHASE 7
                </span>
                <span className="px-3 py-1 bg-ice-900/40 border border-ice-700 rounded-full text-xs font-semibold text-ice-400">
                  🔒 LOCKED
                </span>
              </div>
              <h1 className="text-4xl font-display font-bold gradient-text">
                🎁 Offer Construction
              </h1>
              <p className="text-ice-400 text-lg max-w-3xl">
                Build margin-conscious promotional offers with deliverability gate enforcement to protect sender reputation while maximizing revenue.
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
              <h3 className="font-semibold text-amber-300 mb-2">Complete Phase 6 to Unlock</h3>
              <p className="text-ice-400 mb-4">
                Offer construction requires activated lifecycle revenue and stable deliverability to safely run promotions.
              </p>
              <Link
                href="/dashboard/revenue-activation"
                className="inline-block mt-2 px-6 py-2 bg-ocean-600 text-white font-medium rounded-lg hover:bg-ocean-700 transition-colors"
              >
                Go to Revenue Activation →
              </Link>
            </div>
          </div>
        </div>

        {/* Preview Content (Locked) */}
        <div className="glass-card p-8 opacity-60 pointer-events-none">
          <h2 className="text-2xl font-display font-bold mb-6">Promotional Campaigns</h2>

          {/* Gate Status */}
          <div className="glass-card p-6 border-2 border-mint-500/30 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-mint-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-mint-300 mb-2">Deliverability Gate: PASS</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-ice-500">Hard Bounce Rate</p>
                    <p className="text-ice-200 font-medium">0.3% <span className="text-mint-500">✓</span></p>
                  </div>
                  <div>
                    <p className="text-ice-500">Soft Bounce Rate</p>
                    <p className="text-ice-200 font-medium">1.8% <span className="text-mint-500">✓</span></p>
                  </div>
                  <div>
                    <p className="text-ice-500">Spam Rate</p>
                    <p className="text-ice-200 font-medium">0.05% <span className="text-mint-500">✓</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Builder */}
          <div className="glass-card p-6 border border-ice-800/30 mb-6">
            <h3 className="text-xl font-semibold mb-4">Create Campaign</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ice-300 mb-2">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g., Black Friday 2026"
                  className="w-full px-4 py-2 bg-ice-900/40 border border-ice-700 rounded-lg text-ice-200"
                  disabled
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ice-300 mb-2">Discount Type</label>
                  <select className="w-full px-4 py-2 bg-ice-900/40 border border-ice-700 rounded-lg text-ice-200" disabled>
                    <option>Percentage Off</option>
                    <option>Fixed Amount</option>
                    <option>Free Shipping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ice-300 mb-2">Discount Value</label>
                  <input
                    type="number"
                    placeholder="15"
                    className="w-full px-4 py-2 bg-ice-900/40 border border-ice-700 rounded-lg text-ice-200"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ice-300 mb-2">Target Segment</label>
                <select className="w-full px-4 py-2 bg-ice-900/40 border border-ice-700 rounded-lg text-ice-200" disabled>
                  <option>All Subscribers</option>
                  <option>Post-Purchase</option>
                  <option>Pre-Purchase</option>
                  <option>Product Step 1</option>
                  <option>Product Step 2</option>
                </select>
              </div>

              <div className="p-4 bg-ocean-600/10 border border-ocean-600/30 rounded-lg">
                <h4 className="text-sm font-semibold text-ocean-300 mb-2">Margin Impact</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-ice-400">Estimated Recipients</p>
                    <p className="text-ice-200 font-medium">1,250</p>
                  </div>
                  <div>
                    <p className="text-ice-400">Projected Margin Impact</p>
                    <p className="text-ice-200 font-medium">-$3,200</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Past Campaigns */}
          <div className="glass-card p-6 border border-ice-800/30">
            <h3 className="text-xl font-semibold mb-4">Campaign History</h3>
            <div className="text-center py-8 text-ice-500">
              No campaigns created yet
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
