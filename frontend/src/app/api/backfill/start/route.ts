import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysBack = searchParams.get('daysBack') || '90'

    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch(
      `http://localhost:3000/backfill/start?daysBack=${daysBack}`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mock-jwt-token',
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to start backfill' },
      { status: 500 },
    )
  }
}
