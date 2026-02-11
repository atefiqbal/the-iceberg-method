'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CROInsight {
  id: string
  insightType: 'rage_click' | 'dead_click' | 'error_click' | 'quick_back' | 'excessive_scrolling'
  severity: 'low' | 'medium' | 'high' | 'critical'
  pageType: 'homepage' | 'product' | 'collection' | 'cart' | 'checkout' | 'other'
  pageUrl: string
  elementSelector: string
  occurrences: number
  sessionUrls: string[]
  description: string
  resolved: boolean
  createdAt: string
}

interface InsightsSummary {
  total: number
  byPageType: Record<string, number>
  bySeverity: Record<string, number>
  criticalCheckoutIssues: number
}

export default function CROReviewPage() {
  const [insights, setInsights] = useState<CROInsight[]>([])
  const [summary, setSummary] = useState<InsightsSummary | null>(null)
  const [installationStatus, setInstallationStatus] = useState<{
    installed: boolean
    provider?: string
    recommendation?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPageType, setSelectedPageType] = useState<string>('all')

  useEffect(() => {
    fetchCROData()
  }, [selectedPageType])

  const fetchCROData = async () => {
    try {
      setLoading(true)

      // Fetch installation status
      const statusRes = await fetch('/api/cro/installation-status')
      const statusData = await statusRes.json()
      setInstallationStatus(statusData)

      // Fetch insights
      const insightsUrl =
        selectedPageType === 'all'
          ? '/api/cro/insights'
          : `/api/cro/insights?pageType=${selectedPageType}`
      const insightsRes = await fetch(insightsUrl)
      const insightsData = await insightsRes.json()
      setInsights(insightsData)

      // Fetch summary
      const summaryRes = await fetch('/api/cro/insights/summary')
      const summaryData = await summaryRes.json()
      setSummary(summaryData)
    } catch (error) {
      console.error('Failed to fetch CRO data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveInsight = async (insightId: string) => {
    try {
      await fetch(`/api/cro/insights/${insightId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Resolved via dashboard' }),
      })

      // Refresh data
      fetchCROData()
    } catch (error) {
      console.error('Failed to resolve insight:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getInsightTypeLabel = (type: string) => {
    switch (type) {
      case 'rage_click':
        return 'Rage Click'
      case 'dead_click':
        return 'Dead Click'
      case 'error_click':
        return 'Error Click'
      case 'quick_back':
        return 'Quick Back'
      case 'excessive_scrolling':
        return 'Excessive Scrolling'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-white rounded-xl shadow"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!installationStatus?.installed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-100">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                CRO Tool Not Connected
              </h2>
              <p className="text-gray-600 mb-6">
                {installationStatus?.recommendation ||
                  'Install Microsoft Clarity for free behavior analytics'}
              </p>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Why Microsoft Clarity?
                  </h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        100% free with unlimited session recordings
                      </span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Automatic rage click and dead click detection</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Heatmaps for homepage, product pages, and checkout</span>
                    </li>
                    <li className="flex items-start">
                      <svg
                        className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>GDPR compliant and privacy-focused</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="https://clarity.microsoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Set Up Microsoft Clarity
                </a>
                <p className="text-sm text-gray-500 mt-4">
                  After installing Clarity, return here to view insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            CRO Review Dashboard
          </h1>
          <p className="text-gray-600">
            Behavior insights from {installationStatus.provider === 'clarity' ? 'Microsoft Clarity' : 'Hotjar'}
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Total Issues
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {summary.total}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-red-100">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Critical Checkout Issues
              </div>
              <div className="text-3xl font-bold text-red-600">
                {summary.criticalCheckoutIssues}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100">
              <div className="text-sm font-medium text-gray-600 mb-1">
                High Severity
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {summary.bySeverity.high || 0}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-100">
              <div className="text-sm font-medium text-gray-600 mb-1">
                Medium Severity
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                {summary.bySeverity.medium || 0}
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Filter by Page Type
          </label>
          <select
            value={selectedPageType}
            onChange={(e) => setSelectedPageType(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Pages</option>
            <option value="checkout">Checkout</option>
            <option value="cart">Cart</option>
            <option value="product">Product Pages</option>
            <option value="homepage">Homepage</option>
            <option value="collection">Collections</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {insights.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Issues Found
              </h3>
              <p className="text-gray-600">
                Your site has no unresolved friction points. Great job!
              </p>
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(insight.severity)}`}
                      >
                        {insight.severity.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {getInsightTypeLabel(insight.insightType)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {insight.pageType.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {insight.description}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Page:</span>{' '}
                        <code className="bg-gray-100 px-2 py-0.5 rounded">
                          {insight.pageUrl}
                        </code>
                      </div>
                      {insight.elementSelector && (
                        <div>
                          <span className="font-medium">Element:</span>{' '}
                          <code className="bg-gray-100 px-2 py-0.5 rounded">
                            {insight.elementSelector}
                          </code>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Occurrences:</span>{' '}
                        {insight.occurrences}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveInsight(insight.id)}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Mark Resolved
                  </button>
                </div>

                {insight.sessionUrls && insight.sessionUrls.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Session Recordings:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insight.sessionUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Watch Session {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
