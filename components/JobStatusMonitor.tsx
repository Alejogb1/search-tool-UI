"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface JobStatus {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  domain: string
  progress?: number
  message?: string
  error?: string
}

interface JobStatusMonitorProps {
  jobId: string
  domain: string
  onComplete: (jobId: string) => void
  onRetry: () => void
}

export function JobStatusMonitor({ jobId, domain, onComplete, onRetry }: JobStatusMonitorProps) {
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/v1/report/${jobId}`)

      if (response.ok) {
        const data = await response.json()
        setStatus(data)

        // Stop polling if job is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false)
          if (data.status === 'completed') {
            onComplete(jobId)
          }
        }
      } else if (response.status === 404) {
        // Handle job not found
        const errorData = await response.json()
        setStatus({
          job_id: jobId,
          status: 'failed',
          domain: domain,
          error: errorData.message || 'Job not found'
        })
        setIsPolling(false)
      } else {
        // Handle other errors
        const errorData = await response.json()
        setStatus({
          job_id: jobId,
          status: 'failed',
          domain: domain,
          error: errorData.message || 'Failed to check job status'
        })
        setIsPolling(false)
      }
    } catch (error) {
      console.error('Failed to check job status:', error)
      setStatus({
        job_id: jobId,
        status: 'failed',
        domain: domain,
        error: 'Network error - please try again'
      })
      setIsPolling(false)
    }
  }

    // Check immediately
    checkStatus()

    // Poll every 3 seconds if still polling
    let interval: NodeJS.Timeout
    if (isPolling) {
      interval = setInterval(checkStatus, 3000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [jobId, isPolling, onComplete])

  const getStatusDisplay = () => {
    switch (status?.status) {
      case 'pending':
        return {
          title: 'Queued',
          message: 'Your analysis is waiting in queue...',
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800'
        }
      case 'processing':
        return {
          title: 'Processing',
          message: status.message || 'Analyzing your domain...',
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800'
        }
      case 'completed':
        return {
          title: 'Completed!',
          message: 'Your analysis is ready for download.',
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-800'
        }
      case 'failed':
        return {
          title: 'Failed',
          message: status.error || 'Something went wrong with your analysis.',
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800'
        }
      default:
        return {
          title: 'Checking Status...',
          message: 'Getting job status...',
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800'
        }
    }
  }

  const display = getStatusDisplay()

  return (
    <Card className={`p-6 ${display.color}`}>
      <div className="text-center space-y-4">
        <div>
          <h3 className={`text-lg font-semibold ${display.textColor}`}>
            {display.title}
          </h3>
          <p className={`text-sm ${display.textColor} mt-1`}>
            {display.message}
          </p>
        </div>

        {status?.status === 'processing' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${status.progress || 0}%` }}
            />
          </div>
        )}

        <div className="flex justify-center space-x-3">
          {status?.status === 'completed' && (
            <Button
              onClick={() => window.location.href = `/api/v1/domains/${domain}/download`}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Download CSV
            </Button>
          )}

          {status?.status === 'failed' && (
            <Button
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-600">
          Domain: {domain} | Job ID: {jobId}
        </div>
      </div>
    </Card>
  )
}
