'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, createChallenge } from "@/lib/pb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

const categories = [
  "Web3",
  "AI/ML",
  "Mobile",
  "Web",
  "Blockchain",
  "Gaming",
  "Other"
]

export default function CreateChallengePage() {
  const router = useRouter()
  const auth = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    challengetitle: "",
    category: "",
    maxparticipants: 10,
    reward: 100,
    description: "",
    keywords: "",
    submission_end: "",
    voting_end: "",
  })

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to create a challenge</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Basic validation
    if (!formData.challengetitle.trim()) {
      setError("Challenge title is required")
      setIsLoading(false)
      return
    }

    if (!formData.category) {
      setError("Category is required")
      setIsLoading(false)
      return
    }

    if (!formData.description.trim()) {
      setError("Description is required")
      setIsLoading(false)
      return
    }

    if (!formData.submission_end || !formData.voting_end) {
      setError("Both submission and voting end dates are required")
      setIsLoading(false)
      return
    }

    // Validate dates
    const submissionDate = new Date(formData.submission_end)
    const votingDate = new Date(formData.voting_end)
    const now = new Date()

    if (submissionDate <= now) {
      setError("Submission end date must be in the future")
      setIsLoading(false)
      return
    }

    if (votingDate <= submissionDate) {
      setError("Voting end date must be after submission end date")
      setIsLoading(false)
      return
    }

    try {
      const result = await createChallenge({
        ...formData,
        keywords: formData.keywords.split(",").map(k => k.trim()).filter(k => k),
        maxparticipants: Number(formData.maxparticipants),
        reward: Number(formData.reward),
      })

      if (result.success) {
        router.push(`/challenge/${result.challenge.id}`)
      } else {
        setError(result.error || "Failed to create challenge")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Create New Challenge</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="challengetitle">Challenge Title</Label>
            <Input
              id="challengetitle"
              value={formData.challengetitle}
              onChange={(e) => setFormData(prev => ({ ...prev, challengetitle: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maxparticipants">Max Participants</Label>
            <Input
              id="maxparticipants"
              type="number"
              min={1}
              value={formData.maxparticipants}
              onChange={(e) => setFormData(prev => ({ ...prev, maxparticipants: Number(e.target.value) }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="reward">Reward (in tokens)</Label>
            <Input
              id="reward"
              type="number"
              min={0}
              value={formData.reward}
              onChange={(e) => setFormData(prev => ({ ...prev, reward: Number(e.target.value) }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              className="h-32"
            />
          </div>

          <div>
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
              placeholder="e.g., blockchain, defi, web3"
              required
            />
          </div>

          <div>
            <Label htmlFor="submission_end">Submission End Date</Label>
            <Input
              id="submission_end"
              type="datetime-local"
              value={formData.submission_end}
              onChange={(e) => setFormData(prev => ({ ...prev, submission_end: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="voting_end">Voting End Date</Label>
            <Input
              id="voting_end"
              type="datetime-local"
              value={formData.voting_end}
              onChange={(e) => setFormData(prev => ({ ...prev, voting_end: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Challenge"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}