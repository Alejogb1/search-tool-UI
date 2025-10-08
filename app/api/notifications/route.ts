import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  // Mock notification data
  const notifications = [
    {
      id: 1,
      domain: "example.com",
      status: "completed",
      keywordsAnalyzed: 124789,
      timestamp: new Date().toISOString(),
    },
    {
      id: 2,
      domain: "test-domain.com",
      status: "processing",
      keywordsAnalyzed: 0,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  return NextResponse.json(notifications)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, email } = body

    // Mock notification subscription
    const subscription = {
      id: Date.now(),
      domain,
      email,
      status: "active",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(subscription)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create notification subscription" }, { status: 500 })
  }
}
