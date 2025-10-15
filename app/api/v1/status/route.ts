import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Test backend connectivity
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/jobs/test-job`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`
        }
      }
    )

    const backendStatus = {
      url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/jobs/test-job`,
      status: backendResponse.status,
      ok: backendResponse.ok,
      statusText: backendResponse.statusText
    }

    // Test our own endpoints
    const analyzeEndpoint = '/api/v1/analyze'
    const reportEndpoint = '/api/v1/report/test-job'

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        useMockApi: process.env.USE_MOCK_API === 'true',
        apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        hasAuthToken: !!process.env.AUTH_TOKEN
      },
      endpoints: {
        analyze: analyzeEndpoint,
        report: reportEndpoint,
        backend: backendStatus
      },
      message: 'Frontend API is operational'
    })

  } catch (error) {
    console.error('Status check failed:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Unable to connect to backend service',
      message: 'Backend connectivity issue detected'
    }, { status: 503 })
  }
}
