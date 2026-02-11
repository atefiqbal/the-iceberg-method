import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get token from session/cookie
    const token = request.headers.get('authorization')

    const response = await fetch(`${BACKEND_URL}/notifications/mark-all-read`, {
      method: 'POST',
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
    console.error('Failed to mark all notifications as read:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
