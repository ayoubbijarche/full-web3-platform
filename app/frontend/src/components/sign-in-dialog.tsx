import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import Link from "next/link"

export function SignInDialog() {
  return (
    <Dialog>
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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="rounded-[50px] border-[#8a8a8a]"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="rounded-[50px] border-[#8a8a8a]"
            />
          </div>
          <Button variant="link" className="justify-end text-[#b3731d] hover:text-[#b3731d]/80">
            Forgot Password?
          </Button>
        </div>
        <Button className="w-full bg-[#b3731d] hover:bg-[#b3731d]/90">Sign In</Button>
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