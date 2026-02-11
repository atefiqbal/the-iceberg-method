'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ShopifyAuthPage() {
  const searchParams = useSearchParams()
  const [shop, setShop] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    const shopParam = searchParams.get('shop')

    if (code && shopParam) {
      handleOAuthCallback(code, shopParam)
    }
  }, [searchParams])

  const handleOAuthCallback = async (code: string, shop: string) => {
    setIsConnecting(true)

    try {
      const response = await fetch('/api/auth/shopify/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, shop }),
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = '/dashboard'
      } else {
        throw new Error(data.error || 'Authentication failed')
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      alert('Failed to connect to Shopify. Please try again.')
      setIsConnecting(false)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shop) {
      alert('Please enter your Shopify store domain')
      return
    }

    setIsConnecting(true)

    try {
      const response = await fetch('/api/auth/shopify/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop }),
      })

      const data = await response.json()

      if (response.ok && data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error(data.error || 'Failed to initiate OAuth')
      }
    } catch (error) {
      console.error('OAuth init error:', error)
      alert('Failed to connect to Shopify. Please try again.')
      setIsConnecting(false)
    }
  }

  if (isConnecting) {
    return (
      <main className="relative min-h-screen overflow-hidden noise-texture flex items-center justify-center">
        <div className="fixed inset-0 -z-10">
          <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-ocean-600/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-ocean-800/30 rounded-full blur-3xl animate-float animation-delay-400" />
        </div>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-ocean-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xl text-ice-300">Connecting to Shopify...</p>
          <p className="text-sm text-ice-500">This will only take a moment</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden noise-texture">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-ocean-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-ocean-800/30 rounded-full blur-3xl animate-float animation-delay-400" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-8 py-24">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-3xl font-display font-bold gradient-text">Connect Your Shopify Store</h1>
              <p className="text-ice-400">We'll analyze your baseline in 90 seconds</p>
            </div>

            <form onSubmit={handleConnect} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="shop" className="block text-sm font-medium text-ice-300">
                  Store Domain
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="shop"
                    value={shop}
                    onChange={(e) => setShop(e.target.value)}
                    placeholder="yourstore"
                    className="w-full px-4 py-3 bg-ice-900/50 border border-ice-800 rounded-lg text-ice-100 placeholder-ice-600 focus:outline-none focus:border-ocean-600 focus:ring-1 focus:ring-ocean-600 transition-colors pr-32"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ice-500 text-sm font-mono">
                    .myshopify.com
                  </div>
                </div>
                <p className="text-xs text-ice-500">
                  Example: if your store is <code className="text-ocean-400">mystore.myshopify.com</code>, enter <code className="text-ocean-400">mystore</code>
                </p>
              </div>

              <button type="submit" className="btn-primary w-full">
                Connect Shopify Store
              </button>
            </form>

            <div className="pt-6 border-t border-ice-800/50 space-y-3">
              <p className="text-xs text-ice-500 text-center mb-4">What happens next:</p>
              <div className="space-y-2">
                {[
                  { icon: '🔒', text: 'You\'ll authorize read-only access via Shopify OAuth' },
                  { icon: '📊', text: 'We\'ll pull 90 days of historical data to calculate your baseline' },
                  { icon: '🎯', text: 'Your dashboard shows deliverability, funnel health, and backend revenue' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-lg">{step.icon}</span>
                    <span className="text-ice-400">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-ice-600 pt-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Read-only</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-mint-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>2-min setup</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-ice-500 mt-6">
            Already have an account? <a href="/login" className="text-ocean-400 hover:text-ocean-300 underline">Log in</a>
          </p>
        </div>
      </div>
    </main>
  )
}
