'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Integration {
  provider: string
  status: 'active' | 'disconnected' | 'error'
  lastSyncAt: string
}

export default function IntegrationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [connectingKlaviyo, setConnectingKlaviyo] = useState(false)
  const [klaviyoApiKey, setKlaviyoApiKey] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchIntegrations()
  }, [])

  async function fetchIntegrations() {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleConnectKlaviyo(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setConnectingKlaviyo(true)

    try {
      const response = await fetch('/api/klaviyo/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: klaviyoApiKey }),
      })

      if (response.ok) {
        await fetchIntegrations()
        setKlaviyoApiKey('')
        router.push('/dashboard/deliverability')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to connect Klaviyo')
      }
    } catch (error) {
      setError('Failed to connect Klaviyo. Please try again.')
    } finally {
      setConnectingKlaviyo(false)
    }
  }

  async function handleDisconnectKlaviyo() {
    if (!confirm('Are you sure you want to disconnect Klaviyo?')) {
      return
    }

    try {
      const response = await fetch('/api/klaviyo/disconnect', {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchIntegrations()
      }
    } catch (error) {
      console.error('Failed to disconnect Klaviyo:', error)
    }
  }

  const klaviyoIntegration = integrations.find((i) => i.provider === 'klaviyo')

  return (
    <div className="min-h-screen bg-ocean-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ice-50 mb-2">
              Integrations
            </h1>
            <p className="text-ice-400">
              Connect your tools to enable The Iceberg Method
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Shopify Integration */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-ocean-800 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-ice-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.373 10.078l-.275-.013c-.246-.011-.43-.23-.43-.48V8.02c0-1.02-.83-1.85-1.85-1.85h-.54c-.44-1.23-1.63-2.08-3.01-2.08-1.38 0-2.57.85-3.01 2.08h-.54c-1.02 0-1.85.83-1.85 1.85v1.565c0 .25-.184.469-.43.48l-.275.013C3.635 10.103 3 10.75 3 11.565v8.585c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-8.585c0-.815-.635-1.462-1.627-1.487z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-ice-200 mb-1">Shopify</div>
                <div className="text-sm text-ice-500">
                  Connected to yourstore.myshopify.com
                </div>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-mint-500/20 text-mint-400">
              Connected
            </div>
          </div>
        </div>

        {/* Klaviyo Integration */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-ocean-800 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-ice-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-ice-200 mb-1">Klaviyo</div>
              <div className="text-sm text-ice-500">
                Email Service Provider for deliverability monitoring
              </div>
            </div>
            {klaviyoIntegration && (
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-mint-500/20 text-mint-400">
                {klaviyoIntegration.status}
              </div>
            )}
          </div>

          {klaviyoIntegration ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-ocean-900/50 border border-ice-800/30">
                <div className="text-sm text-ice-400">Last synced</div>
                <div className="text-ice-200">
                  {new Date(klaviyoIntegration.lastSyncAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={handleDisconnectKlaviyo}
                className="px-4 py-2 rounded-lg bg-coral-600/20 border border-coral-600/30 text-coral-400 hover:bg-coral-600/30 transition-colors"
              >
                Disconnect Klaviyo
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnectKlaviyo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ice-300 mb-2">
                  Klaviyo Private API Key
                </label>
                <input
                  type="password"
                  value={klaviyoApiKey}
                  onChange={(e) => setKlaviyoApiKey(e.target.value)}
                  placeholder="pk_xxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 rounded-lg bg-ocean-900/50 border border-ice-800/30 text-ice-200 placeholder-ice-600 focus:outline-none focus:border-ocean-500"
                  required
                />
                <p className="text-xs text-ice-500 mt-2">
                  Find your Private API Key in Klaviyo → Settings → API Keys
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-coral-500/10 border border-coral-500/30 text-coral-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={connectingKlaviyo || !klaviyoApiKey}
                  className="px-6 py-3 rounded-lg bg-mint-600 text-white font-medium hover:bg-mint-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingKlaviyo ? 'Connecting...' : 'Connect Klaviyo'}
                </button>
                <a
                  href="https://www.klaviyo.com/settings/account/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors inline-flex items-center gap-2"
                >
                  Get API Key
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </form>
          )}
        </div>

        {/* Other Integrations - Coming Soon */}
        <div className="glass-card p-6 opacity-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-ocean-800 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-ice-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-ice-600 mb-1">
                CRO Tools (Hotjar, Clarity)
              </div>
              <div className="text-sm text-ice-700">
                Available in Phase 3: CRO Review
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
