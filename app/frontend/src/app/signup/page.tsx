import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import logoImage from "@/assets/logo.png"
import { Upload } from "lucide-react"

export default function SignUp() {
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
      <main className="flex justify-center mt-12">
        {/* Decorative Circles */}
        <div className="relative">
          <div className="relative w-[800px] h-[550px]">
            <div className="absolute inset-0 rounded-full bg-[#f8f1e9] flex items-center justify-center">
              <div className="w-[700px] h-[450px] rounded-full bg-[#f1e4d4] flex items-center justify-center">
                <div className="w-[600px] h-[350px] rounded-full bg-[#ecd9c3] flex items-center justify-center">
                  {/* Sign Up Form */}
                  <div className="w-[500px] bg-white rounded-[30px] shadow-lg border-2 border-[#b3731d] p-6">
                    <h1 className="text-2xl font-bold text-center mb-4">Create Account</h1>
                    <form className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {/* Avatar Upload Section */}
                      <div className="col-span-2 flex flex-col items-center mb-4">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24 rounded-full border-2 border-[#b3731d] overflow-hidden bg-gray-100 flex items-center justify-center">
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-500" />
                            <input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept="image/*"
                            />
                          </div>
                          <span className="mt-2 text-sm text-gray-500 text-center">
                            Click to upload avatar
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          placeholder="Enter your username"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="x-profile">X Profile</Label>
                        <Input
                          id="x-profile"
                          placeholder="Enter your X profile"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram">Telegram</Label>
                        <Input
                          id="telegram"
                          placeholder="Enter your Telegram"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell us about yourself"
                          className="min-h-[80px] rounded-[20px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="col-span-2 space-y-4">
                        <Button className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90">
                          Sign Up
                        </Button>
                        <div className="text-center">
                          <span className="text-gray-500">Already have an account? </span>
                          <Link href="/" className="text-[#b3731d] hover:text-[#b3731d]/80 font-medium">
                            Sign In
                          </Link>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 