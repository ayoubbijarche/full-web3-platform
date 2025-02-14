import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import logoImage from "@/assets/logo.png"
import mountImage from "@/assets/mount.png"
import { User, Clock, Video, Wallet, Ticket } from "lucide-react"
import { getChallenge, ChallengeModel } from '@/lib/pb'
import { ChallengeDetails } from '@/components/challenge-details'

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const result = await getChallenge(params.id)

  if (!result.success || !result.challenge) {
    return <div>Failed to load challenge</div>
  }

  const challenge: ChallengeModel = {
    id: result.challenge.id,
    challengetitle: result.challenge.challengetitle,
    category: result.challenge.category,
    participants: result.challenge.participants || [],
    maxparticipants: result.challenge.maxparticipants,
    voters: result.challenge.voters || [],
    reward: result.challenge.reward,
    description: result.challenge.description,
    keywords: result.challenge.keywords || [],
    submission_end: result.challenge.submission_end,
    voting_end: result.challenge.voting_end,
    creator: result.challenge.creator,
    created: result.challenge.created,
    updated: result.challenge.updated,
    image: result.challenge.image
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ChallengeDetails challenge={challenge} />
    </main>
  )
} 