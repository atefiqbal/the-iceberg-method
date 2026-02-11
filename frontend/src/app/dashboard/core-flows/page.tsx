'use client'

import Link from 'next/link'
import { useState } from 'react'

interface FlowTemplate {
  id: string
  name: string
  description: string
  steps: number
  status: 'active' | 'draft' | 'inactive'
  performance?: {
    sent: number
    opened: number
    clicked: number
    revenue: number
  }
}

export default function CoreFlowsPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const templates: FlowTemplate[] = [
    {
      id: 'welcome',
      name: 'Welcome Series',
      description: 'First-purchase onboarding and education',
      steps: 3,
      status: 'draft',
    },
    {
      id: 'abandoned-cart',
      name: 'Abandoned Cart',
      description: '3-step cart recovery sequence',
      steps: 3,
      status: 'draft',
    },
    {
      id: 'abandoned-checkout',
      name: 'Abandoned Checkout',
      description: 'High-intent checkout recovery',
      steps: 2,
      status: 'draft',
    },
    {
      id: 'browse-abandonment',
      name: 'Browse Abandonment',
      description: 'Re-engage browsers who didn\'t add to cart',
      steps: 2,
      status: 'draft',
    },
    {
      id: 'post-purchase',
      name: 'Post-Purchase Education',
      description: 'Product education and usage tips',
      steps: 4,
      status: 'draft',
    },
    {
      id: 'win-back',
      name: 'Win-Back (Nine-Word Email)',
      description: 'Proven low-friction reactivation',
      steps: 1,
      status: 'draft',
    },
  ]

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
          <span className="text-ice-300">Core Flows</span>
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
                  PHASE 2
                </span>
                <span className="px-3 py-1 bg-ice-900/40 border border-ice-700 rounded-full text-xs font-semibold text-ice-400">
                  🔒 LOCKED
                </span>
              </div>
              <h1 className="text-4xl font-display font-bold gradient-text">
                🔄 Core Lifecycle Flows
              </h1>
              <p className="text-ice-400 text-lg max-w-3xl">
                Set up proven email automation to recover abandoned carts, welcome new customers, and reactivate dormant buyers.
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
              <h3 className="font-semibold text-amber-300 mb-2">Complete Phase 1 to Unlock</h3>
              <p className="text-ice-400 mb-4">
                Before setting up lifecycle flows, you must pass the Deliverability gate to ensure emails reach customers.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-ice-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-ice-400">Deliverability Gate: <span className="text-ice-600">Pending</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-ice-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-ice-400">Klaviyo Connected: <span className="text-ice-600">Not Connected</span></span>
                </div>
              </div>
              <Link
                href="/dashboard/deliverability"
                className="inline-block mt-4 px-6 py-2 bg-ocean-600 text-white font-medium rounded-lg hover:bg-ocean-700 transition-colors"
              >
                Go to Deliverability →
              </Link>
            </div>
          </div>
        </div>

        {/* Template Library (Preview - Locked) */}
        <div className="glass-card p-8 opacity-60 pointer-events-none">
          <h2 className="text-2xl font-display font-bold mb-6">Lifecycle Flow Templates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="glass-card p-6 border border-ice-800/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-ice-200">{template.name}</h3>
                  <span className="px-2 py-1 bg-ice-800/40 rounded text-xs text-ice-400">
                    {template.steps} {template.steps === 1 ? 'email' : 'emails'}
                  </span>
                </div>
                <p className="text-sm text-ice-400 mb-4">{template.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-ice-800/40 rounded-full text-xs text-ice-400">
                    {template.status === 'draft' ? '📝 Draft' :
                     template.status === 'active' ? '✅ Active' : '⏸️ Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
