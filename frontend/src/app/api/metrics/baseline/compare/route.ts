import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const url = date
      ? `http://localhost:3000/metrics/baseline/compare?date=${date}`
      : 'http://localhost:3000/metrics/baseline/compare'

    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch(url, {
      headers: {
        Authorization: 'Bearer mock-jwt-token',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to compare to baseline' },
      { status: 500 },
    )
  }
}
