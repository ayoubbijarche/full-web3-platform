'use client'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Video, Clock, Ticket } from "lucide-react"
import { ChallengeCard } from "@/components/challenge-card"
import mountImage from "@/assets/mount.png"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { getChallenges, ChallengeModel } from "@/lib/pb"
import { Navbar } from "@/components/navbar"

export default function Home() {
  const [currentPage, setCurrentPage] = useState(1)
  const [challenges, setChallenges] = useState<ChallengeModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const itemsPerPage = 6

  useEffect(() => {
    let mounted = true
    
    abortControllerRef.current = new AbortController()

    const loadChallenges = async () => {
      setIsLoading(true)
      try {
        const result = await getChallenges(abortControllerRef.current?.signal)
        if (mounted && result.success) {
          setChallenges(result.challenges || [])
        }
      } catch (error) {
        if (mounted && (error as any)?.name !== 'AbortError') {
          console.error('Error loading challenges:', error)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadChallenges()

    return () => {
      mounted = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const totalItems = challenges.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  if (isLoading) {
    return <div>Loading...</div>
  }

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
                  <span className="mt-1 block text-4xl font-bold text-gray-700">Welcome to Coinpetitive</span>
                </h1>
                <p className="mb-6 text-gray-500">We wish you have a nice day of full of challenges</p>
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
                            />
                          </div>

                          {/* Content */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-800 leading-tight max-w-[180px]">Mountain Climbing Challenge</h3>
                              <div className="h-2.5 w-2.5 rounded-full bg-green-400 flex-shrink-0 ml-2 mt-1.5" />
                            </div>
                            <p className="text-sm text-gray-500 leading-normal line-clamp-3 break-words">
                              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center text-xs text-gray-500 mt-auto">
                            <div className="flex items-center gap-1">
                              <Video className="h-4 w-4" />
                              <span>1500</span>
                            </div>
                            <span className="mx-2 text-gray-300">|</span>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>15M+</span>
                            </div>
                            <span className="mx-2 text-gray-300">|</span>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 8V12L14 14M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>15M+</span>
                            </div>
                            <span className="mx-2 text-gray-300">|</span>
                            <div className="flex items-center gap-1">
                              <Ticket className="h-4 w-4" />
                              <span>15M+</span>
                            </div>
                          </div>
                        </div>
                      </div>
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
              <Select defaultValue="all">
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
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] rounded-[50px] border-[#8a8a8a]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="voting">Voting</SelectItem>
                  <SelectItem value="finallised">Finallised</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort By</span>
              <Select defaultValue="date">
                <SelectTrigger className="w-[180px] rounded-[50px] border-[#8a8a8a]">
                  <SelectValue placeholder="Created Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Created Date</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="ml-auto bg-[#b3731d] text-white hover:bg-[#b3731d]"
            >
              Advance Search
            </Button>
          </div>

          {/* Challenge Grid */}
          <div className="grid grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: itemsPerPage })
                .map((_, i) => (
                  <div key={i} className="h-[180px] rounded-[30px] bg-gray-100 animate-pulse" />
                ))
            ) : challenges.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-600 mb-4">No challenges found</h3>
                <Link href="/create-challenge">
                  <Button variant="outline" className="border-[#b3731d] text-[#b3731d] hover:bg-[#b3731d] hover:text-white">
                    Create Your First Challenge
                  </Button>
                </Link>
              </div>
            ) : (
              Array.from({ length: totalItems })
                .slice(startIndex, endIndex)
                .map((_, i) => (
                  <ChallengeCard key={startIndex + i} challenge={challenges[startIndex + i]} />
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
            {[1, 2].map((page) => (
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
              href="/help" 
              className="text-gray-600 hover:text-[#b3731d] transition-colors"
            >
              Help Center
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/contact" 
              className="text-gray-600 hover:text-[#b3731d] transition-colors"
            >
              Contact Us
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
