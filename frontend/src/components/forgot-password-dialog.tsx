'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { resetForgottenPassword } from "@/lib/pb"
import { toast } from "sonner"

interface ForgotPasswordDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ForgotPasswordDialog({ open, onOpenChange, onSuccess }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !code) {
      setError("Please fill all required fields")
      return
    }
    
    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      setError("The recovery code must be 4 digits")
      return
    }
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await resetForgottenPassword(email, code, newPassword)
      
      if (result.success) {
        toast.success("Password reset successful! Please sign in with your new password.")
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
    setEmail("")
    setCode("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Reset Password</DialogTitle>
        </DialogHeader>
        
        {error && <div className="text-red-500 text-sm text-center mb-4">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input 
              id="forgot-email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="rounded-[50px] border-[#8a8a8a]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recovery-code">4-Digit Recovery Code</Label>
            <Input 
              id="recovery-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="Enter code"
              className="rounded-[50px] border-[#8a8a8a] text-center text-xl tracking-widest"
              maxLength={4}
              inputMode="numeric"
              required
            />
            <p className="text-xs text-gray-500">
              Enter the 4-digit code you created when signing up
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="rounded-[50px] border-[#8a8a8a]"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90"
            disabled={isLoading}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}