'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { requestPasswordReset, confirmPasswordReset } from "@/lib/pb"
import { toast } from "sonner"

interface EmailResetDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmailResetDialog({ open, onOpenChange, onSuccess }: EmailResetDialogProps) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email) {
      setError("Please enter your email address")
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await requestPasswordReset(email)
      
      if (result.success) {
        toast.success("Reset instructions sent! Check your email")
        setStep(2)
      } else {
        setError(result.error || "Failed to request password reset")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!token) {
      setError("Please enter the verification token from your email")
      return
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    
    if (newPassword !== confirmPass) {
      setError("Passwords don't match")
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await confirmPasswordReset(token, newPassword)
      
      if (result.success) {
        toast.success("Password reset successful! You can now sign in with your new password")
        handleClose()
        onSuccess?.()
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setEmail("")
    setToken("")
    setNewPassword("")
    setConfirmPass("")
    setError("")
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {step === 1 ? "Reset Password" : "Verify & Set New Password"}
          </DialogTitle>
        </DialogHeader>
        
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="rounded-[50px] border-[#8a8a8a]"
                required
              />
              <p className="text-xs text-gray-500">
                We'll send you an email with password reset instructions
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Instructions"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Verification Token</Label>
              <Input 
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
                className="rounded-[50px] border-[#8a8a8a]"
                required
              />
              <p className="text-xs text-gray-500">
                Enter the token you received in your email
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input 
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="rounded-[50px] border-[#8a8a8a]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password"
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirm new password"
                className="rounded-[50px] border-[#8a8a8a]"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-[#b3731d] hover:bg-[#b3731d]/90"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}