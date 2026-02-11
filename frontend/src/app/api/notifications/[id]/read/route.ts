import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // TODO: Get token from session/cookie
    const token = request.headers.get('authorization')

    const response = await fetch(`${BACKEND_URL}/notifications/${id}/read`, {
      method: 'PATCH',
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
    console.error('Failed to mark notification as read:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
