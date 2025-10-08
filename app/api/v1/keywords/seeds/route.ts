import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Mock seed keywords generator
const generateMockSeeds = (domain: string) => {
  const seeds = [
    `${domain} pricing`,
    `${domain} features`,
    `${domain} alternatives`,
    `${domain} reviews`,
    `${domain} vs competitors`,
    `best ${domain} tools`,
    `${domain} integration`,
    `${domain} support`,
    `${domain} tutorial`,
    `${domain} comparison`
  ]

  return seeds.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      )
    }

    // Use mock data in development
    if (process.env.USE_MOCK_API === "true") {
      const seeds = generateMockSeeds(domain)
      return new NextResponse(seeds, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    // Forward to actual backend - Keyword Analysis API
    const formData = new FormData()
    formData.append('domain', domain)

    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/keywords/seeds`,
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

    const seedsText = await backendResponse.text()
    return new NextResponse(seedsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
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
