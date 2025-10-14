import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const { domain } = params

  // Use mock data in development
  if (process.env.USE_MOCK_API === 'true') {
    // Simulate job creation for CSV generation
    return NextResponse.json({
      job_id: `mock_csv_${Date.now()}`,
      status: 'pending',
      message: 'CSV generation job created successfully'
    })
  }

  // Forward to actual backend
  try {
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/domains/${domain}/generate-csv`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Backend connection failed:', error)
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 503 }
    )
  }
}
