import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch('http://localhost:3000/metrics/baseline', {
      headers: {
        Authorization: 'Bearer mock-jwt-token',
      },
    })

    if (response.status === 404 || !response.ok) {
      return NextResponse.json(null)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(null)
  }
}

export async function POST() {
  try {
    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch('http://localhost:3000/metrics/baseline/recalculate', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mock-jwt-token',
        'Content-Type': 'application/json',
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
      { error: 'Failed to recalculate baseline' },
      { status: 500 },
    )
  }
}
