'use client'

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video, Wallet, Users, Calendar } from "lucide-react"
import { ChallengeModel, pb } from '@/lib/pb'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RelativeTime } from "@/components/relative-time"

interface ChallengeDetailsProps {
  challenge: ChallengeModel
}

export function ChallengeDetails({ challenge }: ChallengeDetailsProps) {
  const keywords = Array.isArray(challenge.keywords) ? challenge.keywords : [];
  
  // Get the full image URL from PocketBase
  const imageUrl = challenge.image 
    ? pb.files.getUrl(challenge, challenge.image)
    : '';

  return (
    <div className="w-full pl-4">
      {/* Header Section */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Thumbnail and Content Below */}
        <div className="col-start-1 col-span-8">
          <div className="grid grid-cols-8 gap-8">
            {/* Thumbnail */}
            <div className="col-span-3">
              <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={challenge.challengetitle}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            </div>

            {/* Title and Stats */}
            <div className="col-span-5">
              <h1 className="text-2xl font-bold mb-4">{challenge.challengetitle}</h1>
              <div className="flex items-center space-x-2 text-[10px] text-gray-600 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Avatar className="h-3 w-3">
                    <AvatarFallback>{challenge.creator.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[60px]">{challenge.creator}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wallet className="h-3 w-3" />
                  <span>{challenge.reward}$CPT</span>
                </div>
                <div className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  <span>{challenge.participants.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{challenge.participants.length}/{challenge.maxparticipants}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <RelativeTime date={challenge.submission_end} />
                </div>
              </div>
            </div>

            {/* Creator Video - Under Thumbnail */}
            <div className="col-span-3">
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-semibold mb-2">Creator's Video</h3>
                <div className="aspect-video relative rounded bg-gray-100 mb-2">
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <Video className="h-8 w-8" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>{challenge.creator.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{challenge.creator}</span>
                </div>
              </div>
            </div>

            {/* Description - Next to Creator Video */}
            <div className="col-span-5">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{challenge.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button and Chat Section */}
        <div className="col-span-4">
          <Button 
            className="w-full mb-4"
            disabled={challenge.participants.length >= challenge.maxparticipants}
          >
            <span className="text-xs">Submit My Video (5 $CPT)</span>
          </Button>

          <div className="bg-white rounded-lg border-2 border-gray-200 flex flex-col h-[calc(100%-3rem)] min-h-[500px]">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <div className="text-center text-gray-500 text-sm">
                  Chat messages will appear here
                </div>
              </div>
            </div>

            <div className="p-4 border-t-2 border-gray-200">
              <Input 
                placeholder="Input your msg" 
                className="rounded-full text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="mt-8 ml-[col-start-1] w-[calc(66.666%-2rem)]">
        <h3 className="font-semibold mb-4 pb-2 border-b">Submitted Videos</h3>
        <div className="grid grid-cols-3 gap-4">
          {challenge.participants.map((participant, index) => (
            <div key={index} className="border rounded-lg p-2">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{participant.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{participant}</span>
              </div>
              <Button variant="outline" className="w-full text-sm">
                Vote (5 $CPT)
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 