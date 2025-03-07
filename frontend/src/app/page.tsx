'use client'

import * as React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, User, Users, Coins, Ticket, Video, Clock } from "lucide-react"
import ChallengeCard from "@/components/challenge-card"
import mountImage from "@/assets/mount.webp"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getChallenges, type ChallengeModel } from "@/lib/pb"
import { Navbar } from "@/components/navbar"

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1)
  const [challenges, setChallenges] = useState<ChallengeModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [featuredChallenge, setFeaturedChallenge] = useState<ChallengeModel | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedState, setSelectedState] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  
  const itemsPerPage = 6
  useEffect(() => {
    const abortController = new AbortController();
    let isSubscribed = true;

    const fetchChallenges = async () => {
      try {
        const result = await getChallenges(undefined, abortController.signal);
        if (isSubscribed && result.success && result.challenges) {
          setChallenges(result.challenges);
          if (result.challenges.length > 0) {
            setFeaturedChallenge(result.challenges[0]);
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error fetching challenges:', error);
        }
      }
      if (isSubscribed) {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchChallenges();

    // Set up interval for subsequent fetches
    const intervalId = setInterval(fetchChallenges, 5000); // 5000ms = 5 seconds

    // Cleanup function
    return () => {
      isSubscribed = false;
      abortController.abort();
      clearInterval(intervalId); // Clear the interval when component unmounts
    };
  }, []); // Empty dependency array since we want this to run only once on mount
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const getFilteredChallenges = () => {
    let filtered = [...challenges]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(challenge => 
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(challenge => 
        challenge.category.toLowerCase() === selectedCategory.toLowerCase()
      )
    }

    // State filter
    if (selectedState !== "all") {
      filtered = filtered.filter(challenge => 
        challenge.state.toLowerCase() === selectedState.toLowerCase()
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created).getTime() - new Date(a.created).getTime()
      } else if (sortBy === "popular") {
        return (b.participants?.length || 0) - (a.participants?.length || 0)
      }
      return 0
    })

    return filtered
  }

  const filteredChallenges = getFilteredChallenges()
  const totalItems = filteredChallenges.length
  const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage)

  return (
    <div className="min-h-screen flex flex-col">
      <main>
        {/* Hero Section with Featured Challenge */}
        <div className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-8 py-2">
            <div className="relative z-10 flex justify-between items-center">
              {/* Left Content */}
              <div className="w-1/2">
                <h1 className="mb-2">
                  <span className="block text-4xl font-bold text-[#b3731d]">Hello,</span>
                  <span className="mt-1 block text-4xl font-bold text-gray-700">
                    Welcome to Coinpetitive
                  </span>
                </h1>
                <p className="mb-6 text-gray-500">
                  We wish you have a nice day full of challenges
                </p>
                <Link href="/create-challenge">
                  <Button className="px-6 py-2 h-11 font-bold">
                    Start A New Challenge
                  </Button>
                </Link>

                {/* Search Bar */}
                <div className="relative mt-8">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search Challenge"
                    className="w-[400px] rounded-[50px] border-[#898989] pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Right Content - Concentric Circles */}
              <div className="relative w-[600px] h-[600px]">
                {/* Outer Circle */}
                <div className="absolute inset-0 rounded-full bg-[#f8f1e9] flex items-center justify-center">
                  {/* Middle Circle */}
                  <div className="w-[500px] h-[500px] rounded-full bg-[#f1e4d4] flex items-center justify-center">
                    {/* Inner Circle */}
                    <div className="w-[400px] h-[400px] rounded-full bg-[#ecd9c3] flex items-center justify-center">
                      {/* Featured Challenge Card */}
                      <div className="w-[290px] h-[360px] bg-white rounded-[30px] shadow-lg border-2 border-[#b3731d] p-4">
                        <div className="h-full flex flex-col">
                          {/* Thumbnail */}
                          <div className="relative h-[160px] w-full overflow-hidden rounded-2xl mb-4">
                            <Image
                              src={mountImage}
                              alt="Mountain Climbing"
                              fill
                              className="object-cover"
                              draggable={false}
                            />
                          </div>

                          {/* Content */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-800 leading-tight max-w-[180px]">
                                Let us Carry the logs & the boats !
                              </h3>
                              <div className="h-2.5 w-2.5 rounded-full bg-green-400 flex-shrink-0 ml-2 mt-1.5" />
                            </div>
                            <p className="text-sm text-gray-500 leading-normal line-clamp-3 break-words">
                            Carrying logs is a physically and mentally demanding challenge that tests raw strength, endurance, and resilience. Whether it’s part of military-style training, survival exercises, or extreme fitness routines, the log carry pushes the body to its limits by requiring participants to transport heavy, awkwardly shaped logs over a set distance or duration.
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <div className="flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>100 CPT</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>5 CPT</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>24</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* End Featured Challenge Card */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rest of the content */}
        <div className="mx-auto max-w-7xl px-8 py-8">
          {/* Filters */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Category</span>
              <Select 
                defaultValue="all" 
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-[180px] rounded-[50px] border-[#8a8a8a]">
                  <SelectValue placeholder="All Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Category</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">State</span>
              <Select 
                defaultValue="all"
                value={selectedState}
                onValueChange={setSelectedState}
              >
                <SelectTrigger className="w-[180px] rounded-[50px] border-[#8a8a8a]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="registration">Open</SelectItem>
                  <SelectItem value="voting">Voting</SelectItem>
                  <SelectItem value="completed">Finalized</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort By</span>
              <Select 
                defaultValue="date"
                value={sortBy}
                onValueChange={setSortBy}
              >
                <SelectTrigger className="w-[180px] rounded-[50px] border-[#8a8a8a]">
                  <SelectValue placeholder="Created Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Created Date</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="ml-auto bg-[#b3731d] text-white hover:bg-[#b3731d]">
              Advance Search
            </Button>
          </div>

          {/* Challenge Grid */}
          <div className="grid grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-3 text-center py-12">
                <p>Loading challenges...</p>
              </div>
            ) : filteredChallenges.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <h3 className="text-xl font-medium text-gray-600 mb-4">
                  No challenges found
                </h3>
                <Link href="/create-challenge">
                  <Button
                    variant="outline"
                    className="border-[#b3731d] text-[#b3731d] hover:bg-[#b3731d] hover:text-white"
                  >
                    Create Your First Challenge
                  </Button>
                </Link>
              </div>
            ) : (
              filteredChallenges.slice(startIndex, endIndex).map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={{
                    ...challenge,
                    creator: challenge.expand?.creator?.username || 'Anonymous',
                    image: challenge.image 
                      ? `http://127.0.0.1:8090/api/files/challenges/${challenge.id}/${challenge.image}` 
                      : undefined
                  }}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-[#b3731d] text-white hover:bg-[#b3731d]/90"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
              <Button
                key={page}
                variant="outline"
                className={
                  page === currentPage
                    ? "border-[#b3731d] text-[#b3731d] hover:bg-transparent hover:text-[#b3731d] hover:border-[#b3731d]"
                    : "hover:bg-transparent hover:text-inherit"
                }
                size="icon"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="bg-[#b3731d] text-white hover:bg-[#b3731d]/90"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto">
        <div className="flex justify-center">
          <div className="w-[80%] h-px bg-[#898989]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-center gap-8">
            <Link
              href="/faq"
              className="text-gray-600 hover:text-[#b3731d] transition-colors"
            >
              FAQ
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/usage"
              className="text-gray-600 hover:text-[#b3731d] transition-colors"
            >
              HOW TO USE COINPETITIVE
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/privacy"
              className="text-gray-600 hover:text-[#b3731d] transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
