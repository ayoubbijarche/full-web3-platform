'use client'

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import logoImage from "@/assets/logo.png"
import { Upload } from "lucide-react"
import { useState, useEffect } from "react"
import { signUp } from "@/lib/pb"
import { useRouter } from "next/navigation"
import { useWallet } from '@solana/wallet-adapter-react';

export default function SignUp() {
  const { publicKey, connected } = useWallet();
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    xProfile: "",
    telegram: "",
    pubkey: "", // Add this field
  })
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (connected && publicKey) {
      setFormData(prev => ({
        ...prev,
        pubkey: publicKey.toString()
      }));
    }
  }, [connected, publicKey]);

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

    if (!formData.pubkey) {
      setError("Please connect your wallet to continue");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp({
        ...formData,
        avatar: avatar || undefined,
        pubkey: formData.pubkey // Pass the pubkey
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
      {/* Main Content - Responsive layout */}
      <main className="flex justify-center px-4 py-6 sm:py-12">
        {/* Responsive Container */}
        <div className="w-full max-w-[500px]">
          {/* Sign Up Form - Full width on mobile */}
          <div className="w-full bg-white rounded-[20px] sm:rounded-[30px] shadow-lg border-2 border-[#b3731d] p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-4">Create Account</h1>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
              {/* Avatar Upload Section */}
              <div className="col-span-1 sm:col-span-2 flex flex-col items-center mb-2 sm:mb-4">
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[#b3731d] overflow-hidden bg-gray-100 flex items-center justify-center">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    )}
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <span className="mt-2 text-xs sm:text-sm text-gray-500 text-center">
                    Click to upload avatar
                  </span>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="username" className="text-sm">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  className="rounded-[50px] border-[#8a8a8a] h-9 sm:h-10 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="rounded-[50px] border-[#8a8a8a] h-9 sm:h-10 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="x-profile" className="text-sm">X Profile</Label>
                <Input
                  id="xProfile"
                  value={formData.xProfile}
                  onChange={handleInputChange}
                  placeholder="Enter your X profile"
                  className="rounded-[50px] border-[#8a8a8a] h-9 sm:h-10 text-sm"
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="telegram" className="text-sm">Telegram</Label>
                <Input
                  id="telegram"
                  value={formData.telegram}
                  onChange={handleInputChange}
                  placeholder="Enter your Telegram"
                  className="rounded-[50px] border-[#8a8a8a] h-9 sm:h-10 text-sm"
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="rounded-[50px] border-[#8a8a8a] h-9 sm:h-10 text-sm"
                  required
                />
              </div>
              
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="passwordConfirm" className="text-sm">Confirm Password</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="rounded-[50px] border-[#8a8a8a] h-9 sm:h-10 text-sm"
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2 space-y-1 sm:space-y-2">
                <Label htmlFor="pubkey" className="text-sm">Wallet Address</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="pubkey"
                    value={formData.pubkey}
                    placeholder="Connect your wallet"
                    className="rounded-[50px] border-[#8a8a8a] h-9 sm:h-10 text-sm flex-grow"
                    disabled={connected}
                    onChange={(e) => 
                      setFormData(prev => ({ ...prev, pubkey: e.target.value }))
                    }
                    required
                  />
                  {!connected && (
                    <Button 
                      type="button"
                      className="bg-[#b3731d] hover:bg-[#b3731d]/90 h-9 sm:h-10 text-xs sm:text-sm"
                      onClick={() => {
                        if (window.solana) {
                          window.solana.connect();
                        } else {
                          setError("No wallet found. Please install a Solana wallet extension.");
                        }
                      }}
                    >
                      Connect Wallet
                    </Button>
                  )}
                </div>
                {connected && publicKey && (
                  <p className="text-xs sm:text-sm text-green-600">
                    Wallet connected: {publicKey.toString().substring(0, 4)}...{publicKey.toString().substring(publicKey.toString().length - 4)}
                  </p>
                )}
              </div>

              {error && (
                <div className="col-span-1 sm:col-span-2 text-red-500 text-xs sm:text-sm text-center mt-1">
                  {error}
                </div>
              )}

              <div className="col-span-1 sm:col-span-2 mt-2">
                <Button 
                  type="submit"
                  className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90 h-9 sm:h-10 text-sm sm:text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
              
              <div className="col-span-1 sm:col-span-2 text-center mt-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/signin" className="text-[#b3731d] hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}