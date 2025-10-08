"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function DomainAnalysisForm() {
  const [domain, setDomain] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

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

  const handleReset = () => {
    setDomain("")
    setEmail("")
    setMessage("")
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
