import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

/**
 * Get overview metrics (7 & 30 day aggregates + email attribution)
 * GET /api/metrics/overview
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get token from session/cookie
    const token = request.headers.get('authorization')

    const response = await fetch(`${BACKEND_URL}/metrics/overview`, {
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
    console.error('Failed to fetch overview metrics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
