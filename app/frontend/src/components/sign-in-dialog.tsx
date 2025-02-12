'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { signIn, signOut, useAuth } from "@/lib/pb"
import { useRouter } from "next/navigation"

export function SignInDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(result.error || "Failed to sign in")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    signOut()
    router.refresh()
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[#b3731d] font-medium">{user.username}</span>
        <Button onClick={handleSignOut} variant="outline" className="font-bold">
          <User className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-bold">
          <User className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Sign In</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignIn} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="rounded-[50px] border-[#8a8a8a]"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="rounded-[50px] border-[#8a8a8a]"
              required
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button variant="link" className="justify-end text-[#b3731d] hover:text-[#b3731d]/80">
            Forgot Password?
          </Button>
          <Button 
            type="submit" 
            className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-gray-500">Don't have an account? </span>
          <Link href="/signup" className="text-[#b3731d] hover:text-[#b3731d]/80 font-medium">
            Sign Up
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}