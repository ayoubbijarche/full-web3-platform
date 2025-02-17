import { ChallengeDetails } from '@/components/challenge-details'

// Dummy challenge data to simulate a backend response
const dummyChallenge = {
  challengetitle: 'Sample Challenge Title',
  creator: 'Sample Creator',
  reward: 50,
  participants: ['Alice', 'Bob'],
  maxparticipants: 10,
  image: '', // Replace with a valid image URL if needed
  description: 'This is a sample description for the challenge.',
  keywords: ['sample', 'challenge']
}

export default function ChallengePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <ChallengeDetails challenge={dummyChallenge} />
    </main>
  )
}
