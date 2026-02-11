import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const { jobId } = params

    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch(`http://localhost:3000/backfill/${jobId}`, {
      method: 'DELETE',
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
      { error: 'Failed to cancel backfill' },
      { status: 500 },
    )
  }
}
