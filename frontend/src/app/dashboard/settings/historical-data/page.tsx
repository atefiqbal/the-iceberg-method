'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BackfillJob {
  id: string
  backfillType: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  totalRecords: number
  processedRecords: number
  failedRecords: number
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  metadata: {
    startDate?: string
    endDate?: string
    batchSize?: number
  }
  createdAt: string
  progress: number
}

export default function HistoricalDataPage() {
  const [currentJob, setCurrentJob] = useState<BackfillJob | null>(null)
  const [history, setHistory] = useState<BackfillJob[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [daysBack, setDaysBack] = useState(90)

  useEffect(() => {
    fetchBackfillStatus()
    const interval = setInterval(fetchBackfillStatus, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchBackfillStatus = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch('/api/backfill/status'),
        fetch('/api/backfill/history'),
      ])

      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setCurrentJob(statusData)
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json()
        setHistory(historyData)
      }
    } catch (error) {
      console.error('Failed to fetch backfill status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startBackfill = async () => {
    try {
      setStarting(true)
      const response = await fetch(`/api/backfill/start?daysBack=${daysBack}`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentJob(data)
        alert('Backfill started successfully!')
        fetchBackfillStatus()
      } else {
        const error = await response.json()
        alert(`Failed to start backfill: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to start backfill:', error)
      alert('Failed to start backfill')
    } finally {
      setStarting(false)
    }
  }

  const cancelBackfill = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this backfill?')) return

    try {
      const response = await fetch(`/api/backfill/${jobId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Backfill cancelled successfully')
        fetchBackfillStatus()
      } else {
        alert('Failed to cancel backfill')
      }
    } catch (error) {
      console.error('Failed to cancel backfill:', error)
      alert('Failed to cancel backfill')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-xl shadow-lg p-6 h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/settings"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Historical Data Import
          </h1>
          <p className="text-gray-600">
            Import historical order data from Shopify for accurate baseline calculations
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            📊 Why Import Historical Data?
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Enables accurate baseline calculations for anomaly detection</li>
            <li>• Requires 30+ days of data for reliable benchmarks</li>
            <li>• One-time import pulls last 90 days of Shopify orders</li>
            <li>• Updates customer journey states and lifecycle tracking</li>
          </ul>
        </div>

        {/* Current Job Status */}
        {currentJob && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Current Backfill</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  currentJob.status,
                )}`}
              >
                {currentJob.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Progress Bar */}
            {(currentJob.status === 'in_progress' || currentJob.status === 'pending') && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {currentJob.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${currentJob.progress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {currentJob.processedRecords.toLocaleString()} / {currentJob.totalRecords.toLocaleString()} records processed
                </div>
              </div>
            )}

            {/* Job Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Started:</span>
                <div className="font-semibold text-gray-900">
                  {formatDate(currentJob.startedAt)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>
                <div className="font-semibold text-gray-900">
                  {formatDate(currentJob.completedAt)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Records Processed:</span>
                <div className="font-semibold text-gray-900">
                  {currentJob.processedRecords.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Failed Records:</span>
                <div className="font-semibold text-gray-900">
                  {currentJob.failedRecords.toLocaleString()}
                </div>
              </div>
            </div>

            {currentJob.errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                <strong>Error:</strong> {currentJob.errorMessage}
              </div>
            )}

            {currentJob.status === 'in_progress' && (
              <button
                onClick={() => cancelBackfill(currentJob.id)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Cancel Backfill
              </button>
            )}
          </div>
        )}

        {/* Start Backfill Section */}
        {(!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed' || currentJob.status === 'cancelled') && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Start New Backfill</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days to Import
              </label>
              <input
                type="number"
                value={daysBack}
                onChange={(e) => setDaysBack(parseInt(e.target.value) || 90)}
                min="1"
                max="365"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Import orders from the last {daysBack} days (max 365)
              </p>
            </div>
            <button
              onClick={startBackfill}
              disabled={starting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {starting ? 'Starting...' : 'Start Backfill'}
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Backfill History</h2>
            <div className="space-y-3">
              {history.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                          job.status,
                        )}`}
                      >
                        {job.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(job.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {job.processedRecords.toLocaleString()} records processed
                      {job.failedRecords > 0 && (
                        <span className="text-red-600 ml-2">
                          ({job.failedRecords} failed)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {job.metadata?.startDate && job.metadata?.endDate && (
                      <>
                        {new Date(job.metadata.startDate).toLocaleDateString()} -{' '}
                        {new Date(job.metadata.endDate).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
