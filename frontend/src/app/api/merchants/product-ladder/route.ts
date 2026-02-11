import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch('http://localhost:3000/merchants/product-ladder', {
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch('http://localhost:3000/merchants/product-ladder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer mock-jwt-token',
      },
      body: JSON.stringify(body),
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
      { error: 'Failed to save product ladder' },
      { status: 500 },
    )
  }
}
