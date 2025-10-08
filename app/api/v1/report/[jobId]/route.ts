import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

interface MockReport {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  domain: string
  clusters: Array<{
    name: string
    keywords: string[]
    metrics: {
      search_volume: number
      competition: number
    }
    insights: Array<{
      type: 'usecase' | 'feature' | 'competitor'
      entities: string[]
    }>
  }>
}

const generateMockReport = (jobId: string): MockReport => ({
  job_id: jobId,
  status: jobId.startsWith('mock_') ? 'completed' : 'processing',
  domain: 'example.com',
  clusters: [
    {
      name: 'Technology',
      keywords: ['cloud computing', 'AI', 'machine learning'],
      metrics: {
        search_volume: 15000,
        competition: 85
      },
      insights: [
        {
          type: 'feature',
          entities: ['Scalability', 'Security']
        }
      ]
    }
  ]
})

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { jobId } = params

  // Handle mock responses
  if (process.env.USE_MOCK_API === 'true') {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return NextResponse.json(generateMockReport(jobId))
  }

  // Forward to actual backend
  try {
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/report/${jobId}`,
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
