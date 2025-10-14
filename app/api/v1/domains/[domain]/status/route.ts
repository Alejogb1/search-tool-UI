import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const { domain } = params

  // Use mock data in development
  if (process.env.USE_MOCK_API === 'true') {
    // Simulate clay.com having data
    if (domain === 'clay.com') {
      return NextResponse.json({
        status: 'ready_for_csv',
        keyword_count: 231968,
        message: 'Domain has been processed and is ready for CSV generation'
      })
    }

    return NextResponse.json({
      status: 'not_processed',
      message: 'Domain has not been processed yet'
    })
  }

  // Forward to actual backend
  try {
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/domains/${domain}/status`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`
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
