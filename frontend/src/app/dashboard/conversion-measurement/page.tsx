'use client'

import Link from 'next/link'

export default function ConversionMeasurementPage() {
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
          <span className="text-ice-300">Conversion Measurement</span>
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
                  PHASE 4
                </span>
                <span className="px-3 py-1 bg-ice-900/40 border border-ice-700 rounded-full text-xs font-semibold text-ice-400">
                  🔒 LOCKED
                </span>
              </div>
              <h1 className="text-4xl font-display font-bold gradient-text">
                📊 Conversion Measurement
              </h1>
              <p className="text-ice-400 text-lg max-w-3xl">
                Track email attribution with UTM parameters, measure Revenue Per Recipient (RPR), and calculate the true impact of your lifecycle flows.
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
              <h3 className="font-semibold text-amber-300 mb-2">Complete Phase 3 to Unlock</h3>
              <p className="text-ice-400 mb-4">
                Conversion measurement requires active segments and flows to track attribution and calculate RPR.
              </p>
              <Link
                href="/dashboard/segmentation"
                className="inline-block mt-2 px-6 py-2 bg-ocean-600 text-white font-medium rounded-lg hover:bg-ocean-700 transition-colors"
              >
                Go to Segmentation →
              </Link>
            </div>
          </div>
        </div>

        {/* Preview Content (Locked) */}
        <div className="glass-card p-8 opacity-60 pointer-events-none">
          <h2 className="text-2xl font-display font-bold mb-6">Attribution Dashboard</h2>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-ice-400 mb-2">Email Revenue (30d)</h3>
              <div className="text-3xl font-bold gradient-text">$0</div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-ice-400 mb-2">Email Attribution %</h3>
              <div className="text-3xl font-bold gradient-text">0%</div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-ice-400 mb-2">Avg RPR</h3>
              <div className="text-3xl font-bold gradient-text">$0</div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-sm font-medium text-ice-400 mb-2">Post-Purchase %</h3>
              <div className="text-3xl font-bold gradient-text">0%</div>
              <p className="text-xs text-ice-500 mt-1">Target: 20-30%</p>
            </div>
          </div>

          {/* Flow Performance */}
          <div className="glass-card p-6 border border-ice-800/30">
            <h3 className="text-xl font-semibold mb-4">Flow Performance</h3>
            <div className="space-y-3">
              {['Abandoned Cart', 'Welcome Series', 'Win-Back', 'Post-Purchase'].map((flow) => (
                <div key={flow} className="p-4 bg-ice-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-ice-200 font-medium">{flow}</span>
                    <span className="text-xs px-2 py-1 bg-ice-800/40 rounded text-ice-400">Inactive</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-ice-500 text-xs">Sent</p>
                      <p className="text-ice-300 font-medium">0</p>
                    </div>
                    <div>
                      <p className="text-ice-500 text-xs">Open Rate</p>
                      <p className="text-ice-300 font-medium">0%</p>
                    </div>
                    <div>
                      <p className="text-ice-500 text-xs">Click Rate</p>
                      <p className="text-ice-300 font-medium">0%</p>
                    </div>
                    <div>
                      <p className="text-ice-500 text-xs">RPR</p>
                      <p className="text-ice-300 font-medium">$0.00</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
