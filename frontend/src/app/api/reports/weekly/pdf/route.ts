import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock merchant auth - in production, get from session/JWT
    const response = await fetch('http://localhost:3000/reports/weekly/pdf', {
      headers: {
        Authorization: 'Bearer mock-jwt-token',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to generate PDF' },
        { status: response.status },
      )
    }

    // Get PDF buffer
    const pdfBuffer = await response.arrayBuffer()

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="monday-ritual-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 },
    )
  }
}
