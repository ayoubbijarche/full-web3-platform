'use client'

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import logoImage from "@/assets/logo.png"
import { Upload } from "lucide-react"
import { useState } from "react"
import { signUp } from "@/lib/pb"
import { useRouter } from "next/navigation"

export default function SignUp() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    xProfile: "",
    telegram: "",
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const result = await signUp({
        ...formData,
        avatar: avatar || undefined,
      })

      if (result.success) {
        router.push("/") // Redirect to home page after successful signup
      } else {
        setError(result.error || "Failed to sign up")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">


      {/* Main Content */}
      <main className="flex justify-center mt-12">
        {/* Decorative Circles */}
        <div className="relative">
          <div className="relative w-[800px] h-[550px]">
            <div className="absolute inset-0 rounded-full bg-[#f8f1e9] flex items-center justify-center">
              <div className="relative w-[700px] h-[450px] rounded-full bg-[#f1e4d4] flex items-center justify-center">
                <div className="w-[600px] h-[350px] rounded-full bg-[#ecd9c3] flex items-center justify-center">
                  {/* Sign Up Form */}
                  <div className="w-[500px] bg-white rounded-[30px] shadow-lg border-2 border-[#b3731d] p-6">
                    <h1 className="text-2xl font-bold text-center mb-4">Create Account</h1>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {/* Avatar Upload Section */}
                      <div className="col-span-2 flex flex-col items-center mb-4">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24 h-24 rounded-full border-2 border-[#b3731d] overflow-hidden bg-gray-100 flex items-center justify-center">
                            {avatarPreview ? (
                              <Image
                                src={avatarPreview}
                                alt="Avatar preview"
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Upload className="w-8 h-8 text-gray-400" />
                            )}
                            <input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept="image/*"
                              onChange={handleAvatarChange}
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
                          value={formData.username}
                          onChange={handleInputChange}
                          placeholder="Enter your username"
                          className="rounded-[50px] border-[#8a8a8a]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          className="rounded-[50px] border-[#8a8a8a]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="x-profile">X Profile</Label>
                        <Input
                          id="xProfile"
                          value={formData.xProfile}
                          onChange={handleInputChange}
                          placeholder="Enter your X profile"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram">Telegram</Label>
                        <Input
                          id="telegram"
                          value={formData.telegram}
                          onChange={handleInputChange}
                          placeholder="Enter your Telegram"
                          className="rounded-[50px] border-[#8a8a8a]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Enter your password"
                          className="rounded-[50px] border-[#8a8a8a]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="passwordConfirm">Confirm Password</Label>
                        <Input
                          id="passwordConfirm"
                          type="password"
                          value={formData.passwordConfirm}
                          onChange={handleInputChange}
                          placeholder="Confirm your password"
                          className="rounded-[50px] border-[#8a8a8a]"
                          required
                        />
                      </div>

                      {error && (
                        <div className="col-span-2 text-red-500 text-sm text-center">
                          {error}
                        </div>
                      )}

                      <div className="col-span-2">
                        <Button 
                          type="submit"
                          className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90"
                          disabled={isLoading}
                        >
                          {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
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