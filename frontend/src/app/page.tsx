'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [email, setEmail] = useState('')

  return (
    <main className="relative min-h-screen overflow-hidden noise-texture">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-ocean-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-ocean-800/30 rounded-full blur-3xl animate-float animation-delay-400" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-ice-700/10 rounded-full blur-3xl animate-pulse-slow" />
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
          <Link href="/login" className="text-ice-300 hover:text-ocean-400 transition-colors font-medium">
            Log In
          </Link>
          <Link href="/demo" className="btn-secondary">
            See Demo
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 py-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8 animate-fade-in">
            {/* Credibility badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-600 border-2 border-ice-900" />
                ))}
              </div>
              <span className="text-ice-300">Trusted by <span className="text-ocean-400 font-semibold">47</span> DTC brands</span>
            </div>

            {/* Headline - The Master Formula: Action + Specific Outcome + Timeframe */}
            <h1 className="text-6xl lg:text-7xl font-display font-bold leading-tight text-balance">
              <span className="block text-ice-100">≥20% revenue lift</span>
              <span className="block gradient-text">in 90 days</span>
              <span className="block text-ice-300 text-4xl lg:text-5xl mt-4">without burning cash on ads</span>
            </h1>

            {/* Subheadline - Direct challenge opening */}
            <p className="text-xl text-ice-300 leading-relaxed">
              You've been scaling backwards. Stop throwing money at traffic before fixing what actually drives revenue:
              <span className="text-ocean-400 font-semibold"> lifecycle, funnel integrity, and post-purchase monetization</span>.
            </p>

            {/* Pain Quantification */}
            <div className="glass-card p-6 border-l-4 border-coral-500">
              <p className="text-ice-200 leading-relaxed">
                Premature ad scaling amplifies leaks. Your ROAS tanks. Conversion rates collapse. Backend revenue sits at 8% when it should be 30%.
              </p>
              <p className="text-ice-400 mt-3 text-sm font-mono">
                The result: volatile growth, wasted spend, and a sinking feeling every time you check your dashboard.
              </p>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/shopify" className="btn-primary group">
                Connect Your Shopify Store
                <svg className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <button className="btn-secondary">
                Watch 2-Min Overview
              </button>
            </div>

            {/* Friction reducers */}
            <div className="flex flex-wrap gap-6 text-sm text-ice-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>2-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Read-only access</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>No credit card</span>
              </div>
            </div>
          </div>

          {/* Right: Visual proof */}
          <div className="relative animate-slide-in-right">
            {/* Dashboard preview mockup */}
            <div className="glass-card p-6 space-y-6">
              {/* Metric cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-ice-400">
                  <span>Post-Purchase Revenue</span>
                  <span className="text-ocean-400 font-mono">Target: 20-30%</span>
                </div>
                <div className="relative h-12 bg-ice-900/50 rounded-lg overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-[34%] bg-gradient-to-r from-ocean-600 to-ocean-500 flex items-center justify-end pr-3 animate-slide-in-right animation-delay-400">
                    <span className="text-white font-display font-bold text-lg">34%</span>
                  </div>
                </div>
                <p className="text-xs text-mint-500">✓ Target exceeded. Framework working.</p>
              </div>

              {/* Revenue lift */}
              <div className="metric-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-ice-400 mb-1">Revenue Lift (90 days)</p>
                    <p className="text-4xl font-display font-bold gradient-text">+27.3%</p>
                  </div>
                  <div className="px-3 py-1 bg-mint-500/20 text-mint-400 rounded-full text-xs font-semibold">
                    ON TRACK
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ice-400">
                  <svg className="w-4 h-4 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>vs 14-day baseline, anomalies excluded</span>
                </div>
              </div>

              {/* Gates status */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-ice-300">Framework Gates</p>
                {[
                  { name: 'Deliverability', status: 'pass', metric: '0.3% bounce' },
                  { name: 'Funnel Throughput', status: 'pass', metric: '2.8% CR' },
                  { name: 'CRO Review', status: 'warning', metric: '3 issues' },
                ].map((gate, i) => (
                  <div key={gate.name} className={`flex items-center justify-between p-3 rounded-lg bg-ice-900/50 animate-fade-in animation-delay-${(i + 2) * 200}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${gate.status === 'pass' ? 'bg-mint-500' : 'bg-yellow-500'}`} />
                      <span className="text-sm text-ice-200">{gate.name}</span>
                    </div>
                    <span className="text-xs text-ice-400 font-mono">{gate.metric}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating stats */}
            <div className="absolute -top-8 -right-8 glass-card p-4 animate-float animation-delay-200">
              <p className="text-xs text-ice-400">Weekly Active</p>
              <p className="text-2xl font-display font-bold text-ocean-400">47 brands</p>
            </div>

            <div className="absolute -bottom-8 -left-8 glass-card p-4 animate-float animation-delay-600">
              <p className="text-xs text-ice-400">Avg Lift</p>
              <p className="text-2xl font-display font-bold text-mint-500">+23.7%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6 text-balance">
            Stop scaling the <span className="gradient-text">tip</span> of the iceberg
          </h2>
          <p className="text-xl text-ice-300 max-w-3xl mx-auto">
            The first purchase is visible. But 70% of your revenue potential is underwater—lifecycle flows, funnel integrity, post-purchase monetization.
          </p>
        </div>

        {/* The Iceberg Visual */}
        <div className="glass-card p-12 relative overflow-hidden">
          {/* Water line */}
          <div className="absolute left-0 right-0 top-1/3 h-px bg-ocean-500 z-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-ocean-600 text-white text-xs font-semibold rounded-full">
              MOST BRANDS FOCUS HERE ↑
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Above water (10%) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-12 bg-ice-400 rounded-full" />
                <div>
                  <p className="text-2xl font-display font-bold text-ice-200">10% Visible</p>
                  <p className="text-sm text-ice-400">Traffic & First Purchase</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-ice-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Paid acquisition</span>
                </div>
                <div className="flex items-center gap-2 text-ice-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>First-time purchases</span>
                </div>
              </div>
            </div>

            {/* Below water (90%) */}
            <div className="space-y-4 border-l-4 border-ocean-600 pl-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-32 bg-ocean-500 rounded-full" />
                <div>
                  <p className="text-2xl font-display font-bold gradient-text">90% Hidden</p>
                  <p className="text-sm text-ice-400">Where Real Revenue Lives</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-ocean-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Post-purchase education flows</span>
                </div>
                <div className="flex items-center gap-2 text-ocean-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Abandoned cart/checkout recovery</span>
                </div>
                <div className="flex items-center gap-2 text-ocean-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Win-back & reactivation campaigns</span>
                </div>
                <div className="flex items-center gap-2 text-ocean-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Funnel optimization & trust building</span>
                </div>
                <div className="flex items-center gap-2 text-ocean-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Segmentation & product progression</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">
            The enforced <span className="gradient-text">sequence</span>
          </h2>
          <p className="text-xl text-ice-300 max-w-2xl mx-auto">
            No phase can be skipped. The system blocks paid acquisition until downstream foundations pass their gates.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { phase: '1', name: 'Deliverability', desc: 'Hard bounce ≤0.5%. Emails actually reach customers.', gate: 'PASS REQUIRED' },
            { phase: '2', name: 'Core Flows', desc: '6 mandatory lifecycle flows capturing high-intent moments.', gate: 'PASS REQUIRED' },
            { phase: '3', name: 'Segmentation', desc: 'Pre vs post-purchase. Product progression. No generic blasts.', gate: 'PASS REQUIRED' },
            { phase: '4', name: 'Funnel Measurement', desc: 'CR >2% for 3+ days. ±10% variance max.', gate: 'PASS REQUIRED' },
            { phase: '5', name: 'CRO Observation', desc: 'Friction points identified. Money pages optimized.', gate: 'REVIEW' },
            { phase: '6', name: 'Revenue Activation', desc: 'Backend revenue from existing customers. Safe, fast.', gate: 'PASS REQUIRED' },
            { phase: '7', name: 'Offer Construction', desc: 'Margin-optimized attraction mechanism that funds acquisition.', gate: 'VALIDATION' },
            { phase: '8', name: 'Paid Acquisition', desc: 'NOW you can scale traffic without burning cash.', gate: 'UNLOCKED' },
          ].map((step, i) => (
            <div key={step.phase} className={`glass-card p-6 flex items-center gap-6 hover:bg-ice-900/60 transition-all duration-300 animate-fade-in animation-delay-${i * 100}`}>
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 flex items-center justify-center">
                <span className="text-2xl font-display font-bold text-white">{step.phase}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-display font-bold text-ice-100 mb-1">{step.name}</h3>
                <p className="text-ice-400">{step.desc}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-xs font-semibold ${
                step.gate === 'UNLOCKED' ? 'bg-mint-500/20 text-mint-400' :
                step.gate === 'REVIEW' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-ocean-500/20 text-ocean-400'
              }`}>
                {step.gate}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative px-8 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-display font-bold mb-6">
            What happens when you fix the <span className="gradient-text">foundation</span> first
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              quote: "Backend revenue went from 11% to 28% in 6 weeks. We were sitting on a goldmine.",
              metric: "+154% lift",
              author: "Sarah K.",
              business: "Skincare DTC, $180K/mo"
            },
            {
              quote: "Finally stopped hemorrhaging money on Facebook. Turns out our funnel was broken, not our targeting.",
              metric: "2.1% → 3.4% CR",
              author: "Marcus T.",
              business: "Supplements, $340K/mo"
            },
            {
              quote: "The Monday Ritual dashboard saved us 6 hours a week. And we actually hit our targets now.",
              metric: "+$47K in 90 days",
              author: "Jessica R.",
              business: "Home Goods, $290K/mo"
            },
          ].map((testimonial, i) => (
            <div key={i} className={`metric-card animate-slide-up animation-delay-${i * 200}`}>
              <div className="mb-4">
                <div className="text-3xl font-display font-bold gradient-text mb-2">{testimonial.metric}</div>
                <p className="text-ice-200 leading-relaxed">"{testimonial.quote}"</p>
              </div>
              <div className="pt-4 border-t border-ice-800/50">
                <p className="font-semibold text-ice-300">{testimonial.author}</p>
                <p className="text-sm text-ice-500">{testimonial.business}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-8 py-32 max-w-4xl mx-auto text-center">
        <div className="glass-card p-12 space-y-8">
          <h2 className="text-5xl font-display font-bold">
            Ready to fix the <span className="gradient-text">90% you can't see</span>?
          </h2>

          <p className="text-xl text-ice-300 max-w-2xl mx-auto">
            Connect your Shopify store. We'll analyze your lifecycle, funnel, and backend revenue in 90 seconds. Then show you exactly where the leaks are.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/auth/shopify" className="btn-primary text-lg px-12 py-5">
              Connect Shopify Store →
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-sm text-ice-400 pt-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Read-only OAuth</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>2-minute setup</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Free baseline analysis</span>
            </div>
          </div>

          <p className="text-sm text-ice-500 pt-8">
            Not ready? <Link href="/learn-more" className="text-ocean-400 hover:text-ocean-300 underline">Read the methodology</Link> or <Link href="/demo" className="text-ocean-400 hover:text-ocean-300 underline">watch the demo</Link>.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-8 py-12 border-t border-ice-800/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-ice-500 text-sm">
          <p>© 2026 The Iceberg Method. Built for bootstrapped DTC brands.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-ocean-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ocean-400 transition-colors">Terms</Link>
            <Link href="/docs" className="hover:text-ocean-400 transition-colors">Documentation</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
