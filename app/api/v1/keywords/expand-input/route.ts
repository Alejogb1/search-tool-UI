import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Mock expanded keywords generator
const generateMockExpanded = (inputKeywords: string[]) => {
  const expanded = inputKeywords.flatMap(keyword => [
    `${keyword} guide`,
    `${keyword} tutorial`,
    `${keyword} tips`,
    `${keyword} best practices`,
    `${keyword} examples`,
    `how to ${keyword}`,
    `${keyword} tools`,
    `${keyword} software`,
    `${keyword} solutions`
  ])

  return expanded.join('\n')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const inputFile = formData.get('input_file') as File

    if (!inputFile) {
      return NextResponse.json(
        { error: "Input file is required" },
        { status: 400 }
      )
    }

    // Read file content
    const fileContent = await inputFile.text()
    const inputKeywords = fileContent.split('\n').map(line => line.trim()).filter(line => line)

    // Use mock data in development
    if (process.env.USE_MOCK_API === "true") {
      const expanded = generateMockExpanded(inputKeywords)
      return new NextResponse(expanded, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      })
    }

    // Forward to actual backend - Keyword Analysis API
    const backendFormData = new FormData()
    backendFormData.append('input_file', inputFile)

    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/keywords/expand-input`,
      {
        method: "POST",
        body: backendFormData
      }
    )

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      return NextResponse.json(
        { error: errorText || `HTTP ${backendResponse.status}` },
        { status: backendResponse.status }
      )
    }

    const expandedText = await backendResponse.text()
    return new NextResponse(expandedText, {
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
