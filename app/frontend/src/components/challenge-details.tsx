"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Wallet, Users, Heart, MessageCircle, Share2, Trophy, User, Coins, Ticket } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import mountImage from '@/assets/mount.png'
import { SubmitVideoDialog } from "@/components/submit-video-dialog"
import { useState } from "react"

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
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const keywords = Array.isArray(challenge.keywords) ? challenge.keywords : []
  const imageUrl = challenge.image || "/placeholder-image.png"

  return (
    <div className="flex gap-6 p-4 max-w-[1200px] mx-auto">
      {/* Main Content */}
      <div className="flex-1">
        {/* Thumbnail */}
        <div className="border border-[#9A9A9A] rounded-xl overflow-hidden mb-4">
          <div className="aspect-video relative">
            <Image
              src={mountImage}
              alt="Challenge thumbnail"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Title and Details */}
        <div className="p-3 mb-6">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold text-[#4A4A4A]">Mountain Climbing Challenge</h1>
            <Button 
              className="bg-[#b3731d] hover:bg-[#b3731d]/90"
              onClick={() => {
                // Handle join challenge
              }}
            >
              Join Challenge 100 CPT
            </Button>
          </div>
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              <span>Steven</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Video className="h-5 w-5" />
              <span>1500</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <span>15M+</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Coins className="h-5 w-5" />
              <span>15M+</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Ticket className="h-5 w-5" />
              <span>15M+</span>
            </div>
          </div>
          <p className="text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>

        {/* Submissions */}
        <div className="space-y-4">
          {challenge.participants.map((participant, index) => (
            <div key={index} className="flex gap-4 border border-[#9A9A9A] rounded-xl p-4">
              <div className="w-[180px] flex-shrink-0">
                <div className="aspect-video relative rounded-lg bg-gray-100 mb-2">
                  <Image
                    src={mountImage}
                    alt="Video thumbnail"
                    fill
                    className="object-cover rounded-lg"
                  />
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
                  <Button variant="default" size="sm">
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
        <Button 
          className="w-full mb-4"
          onClick={() => setIsSubmitDialogOpen(true)}
        >
          <span className="text-sm">Submit My Video (5 $CPT)</span>
        </Button>

        <div className="border border-[#9A9A9A] rounded-xl flex flex-col h-[calc(100vh-200px)]">
          <div className="p-3 border-b border-[#9A9A9A]">
            <h2 className="font-semibold">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-4">
              <div className="text-center text-gray-500 text-sm">Chat messages will appear here</div>
            </div>
          </div>
          <div className="p-3 border-t border-[#9A9A9A]">
            <div className="flex gap-2">
              <Input placeholder="Input your msg" className="rounded-full text-sm" />
              <Button size="sm">
                Send
              </Button>
            </div>
          </div>
        </div>

        <SubmitVideoDialog 
          open={isSubmitDialogOpen} 
          onOpenChange={setIsSubmitDialogOpen}
        />
      </div>
    </div>
  )
}

