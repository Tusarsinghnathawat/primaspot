"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Heart, MessageCircle, ImageIcon, TrendingUp, Sparkles, AlertCircle, RefreshCw } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { influencerApi, InfluencerData } from "@/lib/api"
import { toast } from "sonner"

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const [data, setData] = useState<InfluencerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchInfluencerData = async (username: string, showToast = false) => {
    try {
      setError(null)
      if (showToast) {
        toast.info(`Scraping data for @${username}...`)
      }
      
      const response = await influencerApi.scrapeInfluencer(username)
      setData(response.data)
      
      if (showToast) {
        toast.success(`Successfully loaded data for @${username}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load influencer data'
      setError(errorMessage)
      if (showToast) {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchInfluencerData(params.name as string, true)
  }

  useEffect(() => {
    if (params.name) {
      fetchInfluencerData(params.name as string)
    }
  }, [params.name])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Scraping Instagram profile for @{params.name}...</p>
          <p className="text-sm text-muted-foreground">This may take 30-60 seconds</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Failed to Load Profile</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
            <Button onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No data available</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Button>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh Data
              </Button>
              <div className="text-sm text-muted-foreground">
                Last updated: {new Date(data.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={data.profilePictureUrl || "/placeholder.svg"} alt={data.fullName} />
                <AvatarFallback className="text-2xl">{data.fullName?.[0] || data.username[0]}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold">{data.fullName || data.username}</h1>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      @{data.username}
                    </Badge>
                  </div>
                  {data.bio && (
                    <p className="text-muted-foreground max-w-md">{data.bio}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {data.followers >= 1000000 
                        ? `${(data.followers / 1000000).toFixed(1)}M` 
                        : data.followers >= 1000 
                        ? `${(data.followers / 1000).toFixed(1)}K` 
                        : data.followers.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data.following.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{data.postsCount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-chart-4" />
                Avg. Likes per Post
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avgLikes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Based on recent posts</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-chart-2" />
                Avg. Comments per Post
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avgComments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Based on recent posts</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-chart-1" />
                Engagement Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.engagementRate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Calculated from recent activity</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Recent Posts Analysis
            </CardTitle>
            <CardDescription>Latest posts with AI-powered content analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {data.posts && data.posts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.posts.map((post, index) => (
                  <Card key={index} className="border-border bg-muted/20">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg">
                      <img
                        src={post.imageUrl || "/placeholder.svg"}
                        alt={`Post ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes >= 1000 ? `${(post.likes / 1000).toFixed(0)}k` : post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {post.comments}
                          </span>
                        </div>
                        {post.vibe && (
                          <Badge variant="outline" className="text-xs">
                            {post.vibe}
                          </Badge>
                        )}
                      </div>

                      {post.caption && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.caption}
                        </p>
                      )}

                      {post.tags && post.tags.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {post.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts data available</p>
                <p className="text-sm">Posts will be analyzed when available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
