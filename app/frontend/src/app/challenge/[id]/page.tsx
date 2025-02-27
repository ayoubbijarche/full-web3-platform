'use client'

import { ChallengeDetails } from '@/components/challenge-details'
import { useEffect, useState, use } from 'react'
import { getChallenges, type ChallengeModel } from '@/lib/pb'  // Changed from getChallenges to getChallenge

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [challenge, setChallenge] = useState<ChallengeModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchChallenge = async () => {
      setIsLoading(true)
      const result = await getChallenges(resolvedParams.id)
      if (result.success && result.challenges && result.challenges.length > 0) {
        const challengeData = result.challenges[0];
        console.log('Challenge data:', challengeData);
        console.log('Video submission:', challengeData.expand?.video_submited);
        setChallenge(challengeData)  // Get the first challenge since we're fetching by ID
      }
      setIsLoading(false)
    }

    fetchChallenge()
  }, [resolvedParams.id])

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div>Loading challenge...</div>
      </main>
    )
  }

  if (!challenge) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div>Challenge not found</div>
      </main>
    )
  }
  return (
    <main className="container mx-auto px-4 py-8">
      <ChallengeDetails challenge={challenge} />
    </main>
  )
}
