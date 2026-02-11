import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

/**
 * Get notifications
 * GET /api/notifications?unread=true&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const unread = searchParams.get('unread')
    const limit = searchParams.get('limit') || '20'

    // TODO: Get token from session/cookie
    const token = request.headers.get('authorization')

    const url = unread === 'true'
      ? `${BACKEND_URL}/notifications?unread=true&limit=${limit}`
      : `${BACKEND_URL}/notifications?limit=${limit}`

    const response = await fetch(url, {
      headers: {
        Authorization: token || '',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: error.message, notifications: [], unreadCount: 0 },
      { status: 500 }
    )
  }
}
