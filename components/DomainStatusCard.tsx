"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DomainStatus {
  status: 'ready_for_csv' | 'not_processed' | 'processing'
  keyword_count?: number
  message: string
}

interface DomainStatusCardProps {
  domain: string
  onGenerateCSV: (domain: string) => void
  onStartAnalysis: (domain: string) => void
}

export function DomainStatusCard({ domain, onGenerateCSV, onStartAnalysis }: DomainStatusCardProps) {
  const [status, setStatus] = useState<DomainStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkDomainStatus = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/v1/domains/${domain}/status`)
        if (response.ok) {
          const data = await response.json()
          setStatus(data)
        }
      } catch (error) {
        console.error('Failed to check domain status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (domain) {
      checkDomainStatus()
    }
  }, [domain])

  if (isLoading) {
    return (
      <Card className="p-4 bg-gray-50">
        <div className="text-center text-gray-600">
          Checking domain status...
        </div>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <div className="text-center text-red-800">
          Failed to check domain status
        </div>
      </Card>
    )
  }

  if (status.status === 'ready_for_csv') {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="text-center space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              Domain Already Processed!
            </h3>
            <p className="text-green-700 mt-1">
              {status.keyword_count?.toLocaleString()} keywords found
            </p>
          </div>

          <div className="flex justify-center space-x-3">
            <Button
              onClick={() => onGenerateCSV(domain)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Generate CSV
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = `/api/v1/domains/${domain}/download`}
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              Download Existing
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-blue-50 border-blue-200">
      <div className="text-center space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-800">
            Ready for Analysis
          </h3>
          <p className="text-blue-700 mt-1">
            {status.message}
          </p>
        </div>

        <Button
          onClick={() => onStartAnalysis(domain)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Start Analysis
        </Button>
      </div>
    </Card>
  )
}
