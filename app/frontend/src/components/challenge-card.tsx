'use client'

import { User, Video, Clock, Ticket } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ChallengeModel } from "@/lib/pb"

interface ChallengeCardProps {
  challenge: ChallengeModel;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  // Calculate if challenge is active based on dates
  const now = new Date()
  const submissionEnd = new Date(challenge.submission_end)
  const votingEnd = new Date(challenge.voting_end)
  const isActive = now < votingEnd

  // Format dates for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  return (
    <Link href={`/challenge/${challenge.id}`}>
      <div className="rounded-[30px] bg-white p-5 shadow-sm hover:shadow-md transition-shadow h-[180px] border border-[#8a8a8a]">
        <div className="flex gap-4 h-full">
          {/* Image */}
          <div className="relative h-[140px] w-[120px] flex-shrink-0 overflow-hidden rounded-2xl">
            <Image
              src={challenge.image || '/placeholder-challenge.jpg'}
              alt={challenge.challengetitle}
              fill
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-800 truncate">
                {challenge.challengetitle}
              </h3>
              <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'} flex-shrink-0 ml-2`} />
            </div>
            
            <p className="text-sm text-gray-500 line-clamp-2 mb-auto">
              {challenge.description}
            </p>
            
            <div className="flex flex-col gap-1.5">
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  <span>{challenge.participants.length}/{challenge.maxparticipants} Participants</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Ends {formatDate(submissionEnd)}</span>
                </div>
              </div>
              
              {/* Category and Reward */}
              <div className="flex items-center justify-between text-xs">
                <span className="px-2 py-0.5 rounded-full bg-[#b3731d]/10 text-[#b3731d]">
                  {challenge.category}
                </span>
                <div className="flex items-center gap-1 text-[#b3731d]">
                  <Ticket className="h-3.5 w-3.5" />
                  <span>{challenge.reward} tokens</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}