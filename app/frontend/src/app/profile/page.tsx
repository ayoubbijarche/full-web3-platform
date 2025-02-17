"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { User, Settings, Grid } from "lucide-react";
import Link from "next/link";
import ChallengeCard from "@/components/challenge-card";
import { EditProfileDialog } from "@/components/edit-profile-dialog";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("created");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Dummy user data replacing backend authentication
  const user = {
    id: "dummy-id",
    username: "JohnDoe",
    avatar: "", // Leave empty if no image is provided
    xProfile: "johndoe",
    telegram: "johndoe",
  };

  // Dummy data for created challenges
  const createdChallenges = [
    { 
      id: 1, 
      title: "Mountain Climbing", 
      description: "A challenging mountain climb...",
      isCreator: true 
    },
    { 
      id: 2, 
      title: "City Marathon", 
      description: "Run through the city...",
      isCreator: true 
    },
  ];

  // Optionally, you could add a condition to simulate an unauthenticated state.
  // For now, we assume the user is always "signed in."
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#8a8a8a]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex gap-8 items-start">
            {/* Profile Picture */}
            <div className="w-40 h-40 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#b3731d]">
              {user.avatar ? (
                <Image
                  src={`http://127.0.0.1:8090/api/files/users/${user.id}/${user.avatar}`}
                  alt={`${user.username}'s avatar`}
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
                <h1 className="text-2xl font-semibold">{user.username}</h1>
                <Button 
                  variant="default"
                  className="flex items-center gap-2"
                  onClick={() => setIsEditDialogOpen(true)}
                >
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
                {user.xProfile && (
                  <Link 
                    href={`https://x.com/${user.xProfile}`}
                    target="_blank"
                    className="text-sm text-[#b3731d] hover:underline"
                  >
                    @{user.xProfile}
                  </Link>
                )}
                {user.telegram && (
                  <Link 
                    href={`https://t.me/${user.telegram}`}
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
          {createdChallenges.map((challenge) => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge}
            />
          ))}
        </div>
      </main>

      <EditProfileDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        user={user}
      />
    </div>
  );
}
