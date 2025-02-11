'use client'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import logoImage from "@/assets/logo.png"
import { Camera } from "lucide-react"

export default function CreateChallenge() {
  return (
    <div className="min-h-screen">
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

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-8 py-8">
        <div className="mb-8">
          <h1 className="text-[#b3731d] font-bold text-2xl">Great!</h1>
          <h2 className="text-gray-700 text-3xl font-semibold">Lets Challenge People</h2>
        </div>

        {/* Main Container with Shadow */}
        <div className="bg-white rounded-[30px] shadow-lg border border-gray-100 p-8">
          <div className="space-y-8">
            {/* Basic Details Section */}
            <div>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-3"></div>
                <div className="col-span-9">
                  <h3 className="text-xl font-semibold mb-6">Basic Details</h3>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-3">
                  <div className="aspect-square bg-gray-100 rounded-[20px] flex items-center justify-center border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto text-gray-400" />
                      <span className="text-sm text-gray-500 mt-2">Upload Image</span>
                      <input type="file" className="hidden" accept="image/*" />
                    </div>
                  </div>
                </div>
                <div className="col-span-9 space-y-6">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8">
                      <Label>Challenge Name</Label>
                      <Input placeholder="Type Here" className="mt-2 rounded-[50px] border-[#8a8a8a]" />
                    </div>
                    <div className="col-span-4">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger className="mt-2 rounded-[50px] border-[#8a8a8a]">
                          <SelectValue placeholder="Select One" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="art">Art</SelectItem>
                          <SelectItem value="music">Music</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label>Registration End</Label>
                      <Input type="date" className="mt-2 rounded-[50px] border-[#8a8a8a]" />
                    </div>
                    <div>
                      <Label>Submission End</Label>
                      <Input type="date" className="mt-2 rounded-[50px] border-[#8a8a8a]" />
                    </div>
                    <div>
                      <Label>Voting End</Label>
                      <Input type="date" className="mt-2 rounded-[50px] border-[#8a8a8a]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-6 grid grid-cols-2 gap-4">
                      <div>
                        <Label>Participants</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Input placeholder="From" className="rounded-[50px] border-[#8a8a8a]" />
                          <Input placeholder="To" className="rounded-[50px] border-[#8a8a8a]" />
                        </div>
                      </div>
                      <div>
                        <Label>Voters</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <Input placeholder="From" className="rounded-[50px] border-[#8a8a8a]" />
                          <Input placeholder="To" className="rounded-[50px] border-[#8a8a8a]" />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3">
                      <Label>Voting Fees</Label>
                      <Input type="number" placeholder="$0.000" className="mt-2 rounded-[50px] border-[#8a8a8a]" />
                    </div>
                    <div className="col-span-3">
                      <Label>Reward</Label>
                      <Input type="number" placeholder="$0.000" className="mt-2 rounded-[50px] border-[#8a8a8a]" />
                    </div>
                  </div>

                  <div>
                    <Label>Description & Rules</Label>
                    <Textarea 
                      placeholder="Type Here" 
                      className="mt-2 min-h-[100px] rounded-[20px] border-[#8a8a8a]" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Other Details Section */}
            <div>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-3"></div>
                <div className="col-span-9">
                  <h3 className="text-xl font-semibold mb-6">Other Details</h3>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-3"></div>
                <div className="col-span-9">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Demo Video Link</Label>
                      <Input placeholder="https://" className="mt-2 rounded-[50px] border-[#8a8a8a] w-full" />
                    </div>
                    <div>
                      <Label>Keywords</Label>
                      <Input placeholder="Artists, Sports, etc" className="mt-2 rounded-[50px] border-[#8a8a8a] w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Options Section */}
            <div>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-3"></div>
                <div className="col-span-9">
                  <h3 className="text-xl font-semibold mb-2">
                    Advanced Option 
                    <span className="text-gray-500 font-normal">(Optional)</span>
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-6 mt-4">
                <div className="col-span-3"></div>
                <div className="col-span-9">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label>Voters</Label>
                      <Input placeholder="Nick Name" className="mt-2 rounded-[50px] border-[#8a8a8a] w-full" />
                    </div>
                    <div>
                      <Label>Participants</Label>
                      <Input placeholder="Nick Name" className="mt-2 rounded-[50px] border-[#8a8a8a] w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                className="px-8 rounded-[50px] border-2 border-[#b3731d] text-[#b3731d] hover:bg-[#b3731d] hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                className="px-8 rounded-[50px] bg-[#b3731d] hover:bg-[#b3731d]/90"
              >
                Challenge Now
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 