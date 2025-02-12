'use client'
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

export default function ChallengeDetails() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white p-4">
        <div className="mx-auto flex max-w-7xl items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={logoImage}
              alt="Coinpetitive Logo"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="text-2xl font-bold text-[#b3731d]">COINPETITIVE</span>
          </Link>
        </div>
        <div className="flex justify-center mt-4">
          <div className="w-[80%] h-px bg-[#898989]"></div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Title Section */}
          <div className="mb-8">
            <h1 className="text-[#b3731d] font-bold text-2xl">You Can Do it.</h1>
            <h2 className="text-gray-700 text-3xl font-semibold">Challenge Details</h2>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="col-span-7">
              {/* Video Section */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 mb-6">
                <Image
                  src={mountImage}
                  alt="Challenge Video"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-[#b3731d] flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Video Button */}
              <Button className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90 py-6 text-lg mb-8">
                Submit Video
              </Button>

              {/* Challenge Info */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold text-gray-800">Mountain Climbing Challenge</h3>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="text-[#b3731d] font-medium">Steven</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-gray-500" />
                    <span>100K</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-gray-500" />
                    <span>1500</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>15M+</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-gray-500" />
                    <span>15M+</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="ml-auto bg-[#b3731d] hover:bg-[#b3731d]/90 text-white">
                        Report Challenge
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Report Challenge</DialogTitle>
                        <DialogDescription>
                          Please provide details about why you are reporting this challenge.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Textarea
                          placeholder="Describe the issue with this challenge..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" className="text-gray-500">
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-[#b3731d] hover:bg-[#b3731d]/90">
                          Submit Report
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been
                  the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of
                  type and scrambled it to make a type specimen book. It has survived not only five centuries, but also
                  the leap into electronic typesetting, remaining essentially unchanged.
                </p>

                {/* Posts */}
                <div className="space-y-4">
                  {[1, 2, 3].map((post) => (
                    <div key={post} className="flex gap-4 p-4 rounded-xl border">
                      <Image
                        src={mountImage}
                        alt="Post thumbnail"
                        width={80}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Posted By: Steve Jones</span>
                        </div>
                        <p className="text-gray-600 text-sm">
                          Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Messages */}
            <div className="col-span-5">
              <div className="bg-white rounded-xl border p-6 h-full">
                <h3 className="text-xl font-semibold mb-6">Messages</h3>
                <div className="space-y-4 mb-6">
                  {[1, 2].map((message) => (
                    <div key={message} className="flex gap-3">
                      <Image
                        src={logoImage}
                        alt="User avatar"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div className="flex-grow">
                        <div className="bg-gray-100 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">Robert Stevenson</span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum
                            has been the industry's standard dummy text ever since the 1500s.
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">12 Jan 2025 | 02 : 00AM</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Type Here" 
                    className="rounded-full border-gray-300"
                  />
                  <Button className="bg-[#b3731d] hover:bg-[#b3731d]/90 rounded-full px-6">
                    Send
                  </Button>
                </div>
              </div>
            </div>
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