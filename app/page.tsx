"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { JobStatusMonitor } from "@/components/JobStatusMonitor"
import { DomainStatusCard } from "@/components/DomainStatusCard"

type ViewState = 'form' | 'domain-check' | 'job-monitor' | 'csv-ready'

export default function DomainAnalysisForm() {
  const [domain, setDomain] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [viewState, setViewState] = useState<ViewState>('form')

  const validateDomain = (d: string) => /^[a-z0-9-]+\.[a-z]{2,}$/.test(d)
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

  const isFormValid = validateDomain(domain) && validateEmail(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateDomain(domain)) {
      setMessage("Invalid domain format")
      return
    }

    if (!validateEmail(email)) {
      setMessage("Invalid email address")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: domain.trim(),
          email: email.trim(),
        }),
      })

      if (response.ok) {
        const responseData = await response.json()

        // Check if it's a job response (new flow)
        if (responseData.job_id) {
          setCurrentJobId(responseData.job_id)
          setViewState('job-monitor')
          return
        }

        // Check if response is CSV (for download) or JSON (for error)
        const contentType = response.headers.get('content-type')

        if (contentType && contentType.includes('text/csv')) {
          // Handle CSV download
          const csvBlob = await response.blob()
          const url = window.URL.createObjectURL(csvBlob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = `keywords-${domain.trim()}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }

        setMessage("Check your email for results!")
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || "Error submitting request")
      }
    } catch (err) {
      setMessage("Network error - please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDomainCheck = (inputDomain: string) => {
    setDomain(inputDomain)
    setViewState('domain-check')
  }

  const handleGenerateCSV = async (domainToProcess: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/domains/${domainToProcess}/generate-csv`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentJobId(data.job_id)
        setViewState('job-monitor')
      } else {
        setMessage("Failed to generate CSV")
      }
    } catch (error) {
      setMessage("Network error - please try again")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartAnalysis = (domainToAnalyze: string) => {
    setDomain(domainToAnalyze)
    setViewState('form')
  }

  const handleJobComplete = (jobId: string) => {
    setViewState('csv-ready')
  }

  const handleRetry = () => {
    setCurrentJobId(null)
    setViewState('form')
  }

  const handleNewAnalysis = () => {
    setDomain("")
    setEmail("")
    setMessage("")
    setCurrentJobId(null)
    setViewState('form')
  }

  const handleReset = () => {
    setDomain("")
    setEmail("")
    setMessage("")
  }

  // Show job status monitor
  if (viewState === 'job-monitor' && currentJobId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analysis in Progress</h1>
          </div>

          <JobStatusMonitor
            jobId={currentJobId}
            domain={domain}
            onComplete={handleJobComplete}
            onRetry={handleRetry}
          />

          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={handleNewAnalysis}
              className="text-gray-600"
            >
              Start New Analysis
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show domain status check
  if (viewState === 'domain-check') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Domain Status</h1>
          </div>

          <DomainStatusCard
            domain={domain}
            onGenerateCSV={handleGenerateCSV}
            onStartAnalysis={handleStartAnalysis}
          />

          <div className="text-center mt-6">
            <Button
              variant="outline"
              onClick={handleNewAnalysis}
              className="text-gray-600"
            >
              Analyze Different Domain
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show CSV ready state
  if (viewState === 'csv-ready') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto">
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-green-800">
                Analysis Complete!
              </h2>
              <p className="text-green-700">
                Your CSV file is ready for download.
              </p>

              <Button
                onClick={() => window.location.href = `/api/v1/domains/${domain}/download`}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Download CSV
              </Button>

              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={handleNewAnalysis}
                  className="text-gray-600"
                >
                  Analyze Another Domain
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Get your domain analysis</h1>
        </div>

        <Card className="p-6 bg-white shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full"
                disabled={isLoading}
                aria-label="Domain input"
              />
            </div>

            <div>
              <Input
                type="email"
                placeholder="email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                disabled={isLoading}
                aria-label="Email address"
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 font-semibold"
                style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
                  backgroundColor: '#16a34a'
                }}
              >
                {isLoading ? "Loading..." : "get data"}
              </Button>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-center text-sm ${
                message.includes("Check your email")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {message}
              </div>
            )}

            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600">input only base or root domains, no subfolders</p>
              <p className="text-xs text-gray-600">we'll deliver you the keywords dataset to your email address</p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
