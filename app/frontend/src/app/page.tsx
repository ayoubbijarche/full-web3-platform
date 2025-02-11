import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, User, Wallet } from "lucide-react"
import { ChallengeCard } from "@/components/challenge-card"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <header className="border-b bg-white p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Coinpetitive Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-xl font-bold">COINPETITIVE</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="font-bold">
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
            <Button className="font-bold">
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Featured Challenge */}
        <div className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-8 py-12">
            <div className="relative z-10 flex">
              {/* Left Content */}
              <div className="w-1/2">
                <h1 className="mb-2">
                  <span className="block text-4xl font-bold text-[#b3731d]">Hello,</span>
                  <span className="mt-1 block text-4xl font-bold text-gray-700">Welcome to Coinpetitive</span>
                </h1>
                <p className="mb-6 text-gray-500">We wish you have a nice day of full of challenges</p>
                <Button className="px-6 py-2 h-11 font-bold">
                  Start A New Challenge
                </Button>

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

              {/* Right Content - Featured Challenge */}
              <div className="relative w-1/2">
                {/* Decorative Circle */}
                <div className="absolute right-[-200px] top-[-100px] h-[600px] w-[600px] rounded-full bg-[#b3731d]/10" />

                {/* Featured Challenge Card */}
                <div className="relative mx-auto w-[400px]">
                  <Card className="overflow-hidden border-2">
                    <CardContent className="p-0">
                      <div className="relative">
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%20from%202025-02-11%2001-28-47-ruQZ3JAGLvZP6xtdlWAqZVo0CCnCCH.png"
                          alt="Mountain Climbing"
                          width={400}
                          height={300}
                          className="h-48 w-full object-cover"
                        />
                        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-green-400" />
                      </div>
                      <div className="p-4">
                        <h3 className="mb-2 text-lg font-semibold">Mountain Climbing Challenge</h3>
                        <p className="mb-4 text-sm text-gray-500">
                          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Steven</span>
                            <span className="text-coinpetitive-primary">100K</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span>1500</span>
                            <span>15M+</span>
                            <span>15M+</span>
                            <span>15M+</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Category</SelectItem>
                  <SelectItem value="climbing">Mountain Climbing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">State</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort By</span>
              <Select defaultValue="date">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Created Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Created Date</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="ml-auto">
              Advance Search
            </Button>
          </div>

          {/* Challenge Grid */}
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ChallengeCard key={i} />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button variant="outline" size="icon">
              &lt;
            </Button>
            {[1, 2, 3, 4, 5, 6].map((page) => (
              <Button
                key={page}
                variant={page === 1 ? "default" : "outline"}
                className={page === 1 ? "bg-coinpetitive-primary hover:bg-coinpetitive-hover" : ""}
                size="icon"
              >
                {page}
              </Button>
            ))}
            <Button variant="outline" size="icon">
              &gt;
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

