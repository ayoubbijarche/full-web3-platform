'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { requestPasswordReset } from "@/lib/pb"
import { toast } from "sonner"
import { Mail, Loader2 } from "lucide-react"

interface EmailResetDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EmailResetDialog({ open, onOpenChange, onSuccess }: EmailResetDialogProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await requestPasswordReset(email)
      
      if (result.success) {
        toast.success("Password reset link sent to your email!", {
          description: "Please check your inbox and follow the instructions to reset your password"
        })
        onSuccess?.()
        handleClose()
      } else {
        setError(result.error || "Failed to send reset email")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
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
        
        <form onSubmit={handleRequestCode} className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input 
              id="reset-email" 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="rounded-[50px] border-[#8a8a8a]"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Reset Link
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}