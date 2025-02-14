'use client'

import { ChallengeModel } from "@/lib/pb"
import { ChallengeCard } from "./challenge-card"

interface ChallengeDetailsProps {
  challenge: ChallengeModel
}

export function ChallengeDetails({ challenge }: ChallengeDetailsProps) {
  return (
    <div>
      <ChallengeCard challenge={challenge} />
      {/* Add other interactive elements here */}
    </div>
  )
} 