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
import Image from "next/image"
import { Calendar, Upload } from "lucide-react"

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")

  const [formData, setFormData] = useState({
    challengetitle: "",
    category: "",
    maxparticipants: "",
    voters: "",
    votingFees: "0.000",
    reward: "0.000",
    description: "",
    demoVideoLink: "",
    keywords: "",
    registration_end: "",
    submission_end: "",
    voting_end: "",
    participantsNickname: "",
    votersNickname: "",
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await createChallenge({
        challengetitle: formData.challengetitle,
        category: formData.category,
        maxparticipants: Number(formData.maxparticipants),
        reward: Number(formData.reward),
        description: formData.description,
        keywords: formData.keywords.split(",").map(k => k.trim()).filter(k => k),
        submission_end: formData.submission_end,
        voting_end: formData.voting_end,
        image: selectedImage || undefined,
      })

      if (result.success && result.challenge) {
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

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newKeyword = keywordInput.trim()
      
      if (newKeyword && keywords.length < 5 && !keywords.includes(newKeyword)) {
        setKeywords([...keywords, newKeyword])
        setKeywordInput("")
        // Update formData with the new keywords
        setFormData(prev => ({ 
          ...prev, 
          keywords: [...keywords, newKeyword].join(',')
        }))
      }
    } else if (e.key === 'Backspace' && keywordInput === '') {
      e.preventDefault()
      const newKeywords = keywords.slice(0, -1)
      setKeywords(newKeywords)
      // Update formData with the new keywords
      setFormData(prev => ({ 
        ...prev, 
        keywords: newKeywords.join(',')
      }))
    }
  }

  const removeKeyword = (indexToRemove: number) => {
    const newKeywords = keywords.filter((_, index) => index !== indexToRemove)
    setKeywords(newKeywords)
    // Update formData with the new keywords
    setFormData(prev => ({ 
      ...prev, 
      keywords: newKeywords.join(',')
    }))
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      <div className="bg-white rounded-3xl p-8 shadow-sm">
        <div className="text-[#B3731D] mb-1">Great!</div>
        <h1 className="text-3xl font-semibold mb-8">Lets Challenge People</h1>

        <div className="grid grid-cols-[300px,1fr] gap-8">
          {/* Image Upload Section */}
          <div className="bg-gray-100 rounded-3xl flex items-center justify-center h-[300px] relative overflow-hidden group border border-[#8a8a8a]">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="Challenge preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer text-white flex flex-col items-center">
                    <Upload className="w-8 h-8 mb-2" />
                    <span>Change Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </>
            ) : (
              <label className="cursor-pointer text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <span className="text-sm text-gray-500">Upload Challenge Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Basic Details</h2>
            
            <div className="grid grid-cols-[1fr,300px] gap-4">
              <div>
                <Label>Challenge Name</Label>
                <Input 
                  placeholder="Type Here"
                  value={formData.challengetitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, challengetitle: e.target.value }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="border-[#8a8a8a] rounded-[50px]">
                    <SelectValue placeholder="Select One" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-16">
              <div>
                <Label>Registration End</Label>
                <div className="relative w-[260px]">
                  <Input 
                    type="datetime-local"
                    value={formData.registration_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_end: e.target.value }))}
                    className="pl-10 pr-8 border-[#8a8a8a] rounded-[50px] min-h-[44px] text-sm w-full appearance-none"
                    style={{ colorScheme: 'light' }}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label>Submission End</Label>
                <div className="relative w-[260px]">
                  <Input 
                    type="datetime-local"
                    value={formData.submission_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, submission_end: e.target.value }))}
                    className="pl-10 pr-8 border-[#8a8a8a] rounded-[50px] min-h-[44px] text-sm w-full appearance-none"
                    style={{ colorScheme: 'light' }}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label>Voting End</Label>
                <div className="relative w-[260px]">
                  <Input 
                    type="datetime-local"
                    value={formData.voting_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, voting_end: e.target.value }))}
                    className="pl-10 pr-8 border-[#8a8a8a] rounded-[50px] min-h-[44px] text-sm w-full appearance-none"
                    style={{ colorScheme: 'light' }}
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Participants</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="From"
                    value={formData.maxparticipants}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxparticipants: e.target.value }))}
                    className="border-[#8a8a8a] rounded-[50px]"
                  />
                  <Input 
                    placeholder="To"
                    className="border-[#8a8a8a] rounded-[50px]"
                  />
                </div>
              </div>
              <div>
                <Label>Voters</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="From"
                    value={formData.voters}
                    onChange={(e) => setFormData(prev => ({ ...prev, voters: e.target.value }))}
                    className="border-[#8a8a8a] rounded-[50px]"
                  />
                  <Input 
                    placeholder="To"
                    className="border-[#8a8a8a] rounded-[50px]"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Voting Fees</Label>
              <Input 
                value={formData.votingFees}
                onChange={(e) => setFormData(prev => ({ ...prev, votingFees: e.target.value }))}
                className="max-w-[200px] border-[#8a8a8a] rounded-[50px]"
              />
            </div>

            <div>
              <Label>Reward</Label>
              <Input 
                value={formData.reward}
                onChange={(e) => setFormData(prev => ({ ...prev, reward: e.target.value }))}
                className="border-[#8a8a8a] rounded-[50px]"
              />
            </div>

            <div>
              <Label>Description & Rules</Label>
              <Textarea 
                placeholder="Type Here"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="h-32 border-[#8a8a8a] rounded-[20px]"
              />
            </div>

            <h2 className="text-xl font-semibold pt-4">Other Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Demo Video Link</Label>
                <Input 
                  placeholder="https://"
                  value={formData.demoVideoLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, demoVideoLink: e.target.value }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                />
              </div>
              <div>
                <Label>Keywords</Label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 p-2 min-h-[44px] border border-[#8a8a8a] rounded-[50px] bg-white">
                    {keywords.map((keyword, index) => (
                      <span 
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-[#f8f1e9] text-[#B3731D] rounded-full text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      placeholder={keywords.length >= 5 ? "Maximum 5 keywords" : "Type and press Enter"}
                      className="flex-1 outline-none border-none bg-transparent placeholder:text-gray-400 min-w-[120px]"
                      disabled={keywords.length >= 5}
                    />
                  </div>
                  <div className="absolute right-3 top-[50%] -translate-y-[50%] text-xs text-gray-400">
                    {keywords.length}/5
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or comma to add a keyword. Maximum 5 keywords allowed.
                </p>
              </div>
            </div>

            <h2 className="text-xl font-semibold pt-4">Advanced Option (Optional)</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Voters</Label>
                <Input 
                  placeholder="Nick Name"
                  value={formData.votersNickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, votersNickname: e.target.value }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                />
              </div>
              <div>
                <Label>Participants</Label>
                <Input 
                  placeholder="Nick Name"
                  value={formData.participantsNickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, participantsNickname: e.target.value }))}
                  className="border-[#8a8a8a] rounded-[50px]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                className="px-8 rounded-[50px]"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                className="px-8 bg-[#B3731D] hover:bg-[#B3731D]/90 rounded-[50px]"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Challenge Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center mt-4">
          {error}
        </div>
      )}
    </div>
  )
}