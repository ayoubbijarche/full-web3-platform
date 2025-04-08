'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { signIn } from "@/lib/pb"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { EmailResetDialog } from "./email-reset-dialog"

interface SignInDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SignInDialog({ open, onOpenChange }: SignInDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [recoveryDialogOpen, setRecoveryDialogOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn(email, password)
      if (result.success) {
        onOpenChange?.(false)
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

  return (
    <>
      <Dialog open={open && !forgotPasswordOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Sign In</DialogTitle>
          </DialogHeader>
          
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          
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
            
            <div className="flex justify-end">
              <Button
                type="button"
                variant="link"
                className="text-[#b3731d] hover:text-[#b3731d]/90 p-0 h-auto font-normal text-sm"
                onClick={() => setForgotPasswordOpen(true)}
              >
                Forgot Password?
              </Button>
            </div>
            
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
            <Link 
              href="/signup" 
              className="text-[#b3731d] hover:text-[#b3731d]/80 font-medium"
              onClick={() => onOpenChange?.(false)}
            >
              Sign Up
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <EmailResetDialog
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
        onSuccess={() => {
          toast.success("Password reset successful!")
        }}
      />
    </>
  )
}