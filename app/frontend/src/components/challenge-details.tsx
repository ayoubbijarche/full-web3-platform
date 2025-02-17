"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Wallet, Users, Heart, MessageCircle, Share2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface ChallengeDetailsProps {
  challenge: {
    challengetitle: string
    creator: string
    reward: number
    participants: string[]
    maxparticipants: number
    image?: string
    description: string
    keywords?: string[]
  }
}

export function ChallengeDetails({ challenge }: ChallengeDetailsProps) {
  const keywords = Array.isArray(challenge.keywords) ? challenge.keywords : []
  const imageUrl = challenge.image || "/placeholder-image.png"

  return (
    <div className="flex gap-6 p-4 max-w-[1200px] mx-auto">
      {/* Main Content */}
      <div className="flex-1">
        {/* Challenge Header */}
        <div className="border rounded-xl overflow-hidden mb-6">
          <div className="aspect-video relative bg-gray-100">
            {imageUrl && (
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={challenge.challengetitle}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-semibold">{challenge.challengetitle}</h1>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4 mr-1" />
                  <span className="text-xs">2.1k</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span className="text-xs">234</span>
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{challenge.creator.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{challenge.creator}</span>
              </div>
              <div className="flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                <span>{challenge.reward}$CPT</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>
                  {challenge.participants.length}/{challenge.maxparticipants}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submissions */}
        <div className="space-y-4">
          {challenge.participants.map((participant, index) => (
            <div key={index} className="flex gap-4 border rounded-xl p-4">
              <div className="w-[180px] flex-shrink-0">
                <div className="aspect-video relative rounded-lg bg-gray-100 mb-2">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{participant.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{participant}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-3">This is the description of the video submission...</p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-1" />
                    <span className="text-xs">Like</span>
                  </Button>
                  <Button variant="outline" size="sm">
                    Vote (5 $CPT)
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Section */}
      <div className="w-[320px] flex-shrink-0">
        <Button className="w-full mb-4">
          <span className="text-sm">Submit My Video (5 $CPT)</span>
        </Button>

        <div className="border-2 rounded-xl flex flex-col h-[calc(100vh-200px)]">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="text-center text-gray-500 text-sm">Chat messages will appear here</div>
            </div>
          </div>
          <div className="p-4 border-t-2">
            <Input placeholder="Input your msg" className="rounded-full text-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}

