'use client'

import { useState, useEffect } from "react"
import { useAuth, pb } from "@/lib/pb"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChallengeCard } from "@/components/challenge-card"
import { User, Settings, Grid } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const auth = useAuth()
  const [challenges, setChallenges] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('created')

  useEffect(() => {
    const fetchChallenges = async () => {
      if (!auth.users) return
      try {
        const createdChallenges = await pb.collection('challenges').getList(1, 50, {
          filter: `creator = "${auth.users.id}"`,
          sort: '-created'
        });
        setChallenges(createdChallenges.items)
      } catch (error) {
        console.error('Error fetching challenges:', error)
      }
    }

    fetchChallenges()
  }, [auth.users])

  if (!auth.isAuthenticated || !auth.users) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#8a8a8a]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex gap-8 items-start">
            {/* Profile Picture */}
            <div className="w-40 h-40 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#b3731d]">
              {auth.users.avatar ? (
                <Image
                  src={`http://127.0.0.1:8090/api/files/users/${auth.users.id}/${auth.users.avatar}`}
                  alt={`${auth.users.username}'s avatar`}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <User className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-2xl font-semibold">{auth.users.username}</h1>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>

              <div className="flex gap-8 mb-4">
                <div>
                  <span className="font-semibold">10</span>{" "}
                  <span className="text-gray-500">challenges</span>
                </div>
                <div>
                  <span className="font-semibold">245</span>{" "}
                  <span className="text-gray-500">points</span>
                </div>
                <div>
                  <span className="font-semibold">3</span>{" "}
                  <span className="text-gray-500">active</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-4">
                {auth.users.xProfile && (
                  <Link 
                    href={`https://x.com/${auth.users.xProfile}`}
                    target="_blank"
                    className="text-sm text-[#b3731d] hover:underline"
                  >
                    @{auth.users.xProfile}
                  </Link>
                )}
                {auth.users.telegram && (
                  <Link 
                    href={`https://t.me/${auth.users.telegram}`}
                    target="_blank"
                    className="text-sm text-[#b3731d] hover:underline"
                  >
                    Telegram
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex justify-center mb-8 border-b border-[#8a8a8a]">
          <button className="flex items-center gap-2 px-8 py-4 text-sm font-medium border-b-2 border-[#b3731d] text-[#b3731d]">
            <Grid className="w-4 h-4" />
            My Challenges
          </button>
        </div>

        {/* Challenge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {challenges.length > 0 ? (
            challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))
          ) : (
            <p className="col-span-2 text-center text-gray-500">No challenges found</p>
          )}
        </div>
      </main>
    </div>
  )
}