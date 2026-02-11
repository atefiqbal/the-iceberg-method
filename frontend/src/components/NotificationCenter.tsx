'use client'

import { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  createdAt: string
  readAt: string | null
  actionUrl?: string
  actionLabel?: string
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const count = notifications.filter((n) => !n.readAt).length
    setUnreadCount(count)
  }, [notifications])

  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications?unread=true&limit=20')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  function getNotificationIcon(severity: string) {
    switch (severity) {
      case 'critical':
        return (
          <div className="w-8 h-8 rounded-full bg-coral-500/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-coral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )
      case 'success':
        return (
          <div className="w-8 h-8 rounded-full bg-mint-500/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-mint-400"
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
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-ocean-500/20 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-ocean-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )
    }
  }

  function formatTimestamp(date: Date) {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  // Mock notifications for demo
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'critical',
      title: 'Deliverability gate failed',
      message: 'Email soft bounce rate exceeded threshold. Promotions blocked.',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      actionUrl: '/dashboard/deliverability',
      actionLabel: 'View Details',
    },
    {
      id: '2',
      type: 'warning',
      title: 'Conversion rate dipping',
      message: 'CR at 2.3% - approaching critical threshold of 2%.',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      actionUrl: '/dashboard/funnel-throughput',
      actionLabel: 'Check Funnel',
    },
    {
      id: '3',
      type: 'success',
      title: 'Baseline calculation complete',
      message: 'Your revenue baseline has been calculated successfully.',
      timestamp: new Date(Date.now() - 86400000),
      read: true,
    },
    {
      id: '4',
      type: 'info',
      title: 'Weekly report ready',
      message: 'Your Monday Ritual report for this week is available.',
      timestamp: new Date(Date.now() - 172800000),
      read: true,
      actionUrl: '/dashboard/monday-ritual',
      actionLabel: 'View Report',
    },
  ]

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-ocean-800/50 transition-colors"
      >
        <svg
          className="w-6 h-6 text-ice-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-coral-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{unreadCount}</span>
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-ocean-900 border border-ice-800/30 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-ice-800/30">
              <h3 className="font-semibold text-ice-200">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-ocean-400 hover:text-ocean-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[500px]">
              {displayNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-ice-500 mb-2">No notifications</div>
                  <div className="text-sm text-ice-600">
                    You're all caught up!
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-ice-800/30">
                  {displayNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-ocean-800/50 transition-colors cursor-pointer ${
                        !notification.readAt ? 'bg-ocean-800/30' : ''
                      }`}
                      onClick={() => {
                        if (!notification.readAt) {
                          markAsRead(notification.id)
                        }
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.severity)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div
                              className={`font-medium text-sm ${
                                !notification.readAt
                                  ? 'text-ice-100'
                                  : 'text-ice-300'
                              }`}
                            >
                              {notification.title}
                            </div>
                            {!notification.readAt && (
                              <div className="w-2 h-2 rounded-full bg-ocean-400 flex-shrink-0 mt-1" />
                            )}
                          </div>

                          <div className="text-sm text-ice-400 mb-2">
                            {notification.message}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-ice-600">
                              {formatTimestamp(new Date(notification.createdAt))}
                            </div>
                            {notification.actionLabel && (
                              <div className="text-xs text-ocean-400 hover:text-ocean-300 font-medium">
                                {notification.actionLabel} →
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
