import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch('http://localhost:3000/backfill/history', {
      headers: {
        Authorization: 'Bearer mock-jwt-token',
      },
    })

    if (!response.ok) {
      return NextResponse.json([])
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json([])
  }
}
