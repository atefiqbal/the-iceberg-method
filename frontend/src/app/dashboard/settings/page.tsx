'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SettingsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    businessName: 'Your Store',
    email: 'owner@yourstore.com',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      slack: false,
      gateFailures: true,
      weeklyReport: true,
      dailyDigest: false,
    },
    preferences: {
      baselineLookbackDays: 30,
      alertThreshold: 'medium',
      autoExportReports: false,
    },
  })

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/merchants/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-ocean-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ice-50 mb-2">Settings</h1>
            <p className="text-ice-400">
              Manage your account and preferences
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Save Success Message */}
        {saved && (
          <div className="glass-card p-4 border-l-4 border-mint-500 bg-mint-500/10">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-mint-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-mint-300 font-medium">
                Settings saved successfully
              </span>
            </div>
          </div>
        )}

        {/* Business Info */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Business Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ice-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={settings.businessName}
                onChange={(e) =>
                  setSettings({ ...settings, businessName: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-ocean-900/50 border border-ice-800/30 text-ice-200 focus:outline-none focus:border-ocean-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ice-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-ocean-900/50 border border-ice-800/30 text-ice-200 focus:outline-none focus:border-ocean-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ice-300 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) =>
                  setSettings({ ...settings, timezone: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg bg-ocean-900/50 border border-ice-800/30 text-ice-200 focus:outline-none focus:border-ocean-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Phoenix">Arizona (MST)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Notification Preferences
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30">
              <div>
                <div className="font-medium text-ice-200 mb-1">
                  Email Notifications
                </div>
                <div className="text-sm text-ice-500">
                  Receive alerts and reports via email
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        email: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ice-800 peer-focus:ring-2 peer-focus:ring-ocean-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30">
              <div>
                <div className="font-medium text-ice-200 mb-1">
                  Gate Failure Alerts
                </div>
                <div className="text-sm text-ice-500">
                  Get notified when a gate fails or enters grace period
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.gateFailures}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        gateFailures: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ice-800 peer-focus:ring-2 peer-focus:ring-ocean-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30">
              <div>
                <div className="font-medium text-ice-200 mb-1">
                  Monday Ritual Report
                </div>
                <div className="text-sm text-ice-500">
                  Receive weekly report every Monday morning
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.weeklyReport}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        weeklyReport: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ice-800 peer-focus:ring-2 peer-focus:ring-ocean-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30">
              <div>
                <div className="font-medium text-ice-200 mb-1">
                  Daily Digest
                </div>
                <div className="text-sm text-ice-500">
                  Summary of key metrics sent daily at 9 AM
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.dailyDigest}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        dailyDigest: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ice-800 peer-focus:ring-2 peer-focus:ring-ocean-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            System Preferences
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ice-300 mb-2">
                Baseline Lookback Period
              </label>
              <select
                value={settings.preferences.baselineLookbackDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      baselineLookbackDays: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-4 py-3 rounded-lg bg-ocean-900/50 border border-ice-800/30 text-ice-200 focus:outline-none focus:border-ocean-500"
              >
                <option value="14">14 days (Faster, less stable)</option>
                <option value="21">21 days (Balanced)</option>
                <option value="30">30 days (Recommended)</option>
                <option value="60">60 days (Most stable)</option>
              </select>
              <p className="text-xs text-ice-500 mt-2">
                How many days of historical data to use for baseline calculation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ice-300 mb-2">
                Alert Sensitivity
              </label>
              <select
                value={settings.preferences.alertThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      alertThreshold: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-3 rounded-lg bg-ocean-900/50 border border-ice-800/30 text-ice-200 focus:outline-none focus:border-ocean-500"
              >
                <option value="low">Low (Critical issues only)</option>
                <option value="medium">Medium (Recommended)</option>
                <option value="high">High (All warnings and issues)</option>
              </select>
              <p className="text-xs text-ice-500 mt-2">
                Control how many alerts you receive
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Quick Links */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Configuration
          </h2>

          <div className="space-y-3">
            <Link
              href="/dashboard/settings/product-ladder"
              className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30 hover:bg-ocean-900/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-800 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-ice-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-ice-200">Product Ladder</div>
                  <div className="text-sm text-ice-500">
                    Configure your product progression
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-ice-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            <Link
              href="/dashboard/settings/historical-data"
              className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30 hover:bg-ocean-900/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-800 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-ice-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-ice-200">Historical Data Import</div>
                  <div className="text-sm text-ice-500">
                    Import past orders for baseline calculations
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-ice-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Integrations Quick Links */}
        <div className="glass-card p-8">
          <h2 className="text-xl font-semibold text-ice-50 mb-6">
            Connected Integrations
          </h2>

          <div className="space-y-3">
            <Link
              href="/dashboard/integrations"
              className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30 hover:bg-ocean-900/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-800 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-ice-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M16.373 10.078l-.275-.013c-.246-.011-.43-.23-.43-.48V8.02c0-1.02-.83-1.85-1.85-1.85h-.54c-.44-1.23-1.63-2.08-3.01-2.08-1.38 0-2.57.85-3.01 2.08h-.54c-1.02 0-1.85.83-1.85 1.85v1.565c0 .25-.184.469-.43.48l-.275.013C3.635 10.103 3 10.75 3 11.565v8.585c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-8.585c0-.815-.635-1.462-1.627-1.487z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-ice-200">Shopify</div>
                  <div className="text-sm text-ice-500">Connected</div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-ice-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            <Link
              href="/dashboard/integrations"
              className="flex items-center justify-between p-4 rounded-lg bg-ocean-900/30 hover:bg-ocean-900/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean-800 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-ice-400"
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
                <div>
                  <div className="font-medium text-ice-200">Klaviyo</div>
                  <div className="text-sm text-ice-500">
                    Manage ESP integration
                  </div>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-ice-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-lg bg-ocean-800/50 border border-ice-800/30 text-ice-300 hover:bg-ocean-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg bg-mint-600 text-white font-medium hover:bg-mint-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
