"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, TrendingUp, Users, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const [influencerName, setInfluencerName] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (influencerName.trim()) {
      router.push(`/profile/${encodeURIComponent(influencerName.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">InfluenceIQ</h1>
            </div>
            <div className="text-sm text-muted-foreground">Analytics Dashboard</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-balance">
              Analyze Instagram
              <span className="text-primary"> Influencer</span> Performance
            </h2>
            <p className="text-xl text-muted-foreground text-pretty">
              Get comprehensive insights, engagement analytics, and AI-powered content analysis for any Instagram
              influencer profile.
            </p>
          </div>

          {/* Search Form */}
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Enter Influencer Name
              </CardTitle>
              <CardDescription>
                Search for any Instagram influencer to view their detailed analytics dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="e.g., cristiano, selenagomez, therock"
                    value={influencerName}
                    onChange={(e) => setInfluencerName(e.target.value)}
                    className="text-lg py-6 pl-4 pr-32 bg-input border-border focus:ring-primary focus:border-primary"
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-6"
                    disabled={!influencerName.trim()}
                  >
                    Analyze
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Engagement Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track likes, comments, and engagement rates across all posts
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-chart-2" />
                </div>
                <h3 className="font-semibold">Audience Insights</h3>
                <p className="text-sm text-muted-foreground">Analyze follower growth and audience demographics</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/30 backdrop-blur-sm">
              <CardContent className="p-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center mx-auto">
                  <BarChart3 className="h-6 w-6 text-chart-3" />
                </div>
                <h3 className="font-semibold">AI Content Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Auto-generated tags, vibe classification, and quality metrics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
