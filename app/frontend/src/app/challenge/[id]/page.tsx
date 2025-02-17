import { getChallenge } from '@/lib/pb'
import { ChallengeDetails } from '@/components/challenge-details'

export default async function ChallengePage({ params }: { params: { id: string } }) {
  const result = await getChallenge(params.id)

  if (!result.success || !result.challenge) {
    return <div>Failed to load challenge</div>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ChallengeDetails challenge={result.challenge} />
    </main>
  )
} 