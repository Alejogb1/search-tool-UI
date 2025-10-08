import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Configure rate limiter only when not using mock API
const ratelimit = process.env.USE_MOCK_API === "false" ? null : new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60s"),
  analytics: true
})

// Mock CSV data generator
const generateMockCSV = (domain: string) => {
  const keywords = [
    { keyword: `${domain} pricing`, searches: 1200, competition: 'HIGH' },
    { keyword: `${domain} alternatives`, searches: 800, competition: 'MEDIUM' },
    { keyword: `best ${domain} features`, searches: 950, competition: 'HIGH' },
    { keyword: `${domain} vs competitors`, searches: 650, competition: 'MEDIUM' },
    { keyword: `${domain} reviews`, searches: 1100, competition: 'HIGH' }
  ]

  const csvContent = 'keyword,avg_monthly_searches,competition_level\n' +
    keywords.map(k => `"${k.keyword}",${k.searches},${k.competition}`).join('\n')

  return csvContent
}

export async function POST(request: NextRequest) {
  // Apply rate limiting only when using real backend
  if (ratelimit) {
    const identifier = request.ip ?? "127.0.0.1"
    const { success } = await ratelimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      )
    }
  }

  try {
    const { domain, email } = await request.json()

    // Validate inputs
    if (!domain || !email) {
      return NextResponse.json(
        { error: "Domain and email are required" },
        { status: 400 }
      )
    }

    // Use mock data in development
    if (process.env.USE_MOCK_API === "true") {
      // Simulate email delivery by just returning success
      console.log(`Mock: Would send keywords CSV to ${email} for domain ${domain}`)
      return NextResponse.json(
        { message: "Analysis request submitted successfully. Check your email for results." },
        { status: 200 }
      )
    }

    // Forward to actual backend - Keyword Analysis API
    const formData = new FormData()
    formData.append('domain', domain)
    formData.append('email', email)

    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/keywords/expanded`,
      {
        method: "POST",
        body: formData
      }
    )

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return NextResponse.json(
        { error: errorText || `HTTP ${backendResponse.status}` },
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
    console.error("Backend connection failed:", error)
    return NextResponse.json(
      { error: "Backend service unavailable" },
      { status: 503 }
    )
  }
}
