import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  const { domain } = params

  // Use mock data in development
  if (process.env.USE_MOCK_API === 'true') {
    // Generate mock CSV content for clay.com
    if (domain === 'clay.com') {
      const csvContent = `keyword,avg_monthly_searches,competition_level
clay.com pricing,1200,HIGH
clay.com alternatives,800,MEDIUM
best clay.com features,950,HIGH
clay.com vs competitors,650,MEDIUM
clay.com reviews,1100,HIGH
clay.com integration,400,LOW
clay.com tutorial,600,MEDIUM
clay.com comparison,750,HIGH
clay.com tools,300,LOW
clay.com support,500,MEDIUM`

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="keywords-${domain}.csv"`
        }
      })
    }

    return NextResponse.json(
      { error: 'CSV not available for this domain' },
      { status: 404 }
    )
  }

  // Forward to actual backend
  try {
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/domains/${domain}/download`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AUTH_TOKEN}`
        }
      }
    )

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: 'CSV not available' },
        { status: backendResponse.status }
      )
    }

    // Forward CSV response for download
    const csvContent = await backendResponse.text()
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="keywords-${domain}.csv"`
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
