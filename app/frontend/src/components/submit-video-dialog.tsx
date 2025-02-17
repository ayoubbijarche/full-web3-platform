"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import mountImage from '@/assets/mount.png'

interface SubmitVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmitVideoDialog({ open, onOpenChange }: SubmitVideoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Video</DialogTitle>
        </DialogHeader>
        
        {/* Decorative Thumbnail */}
        <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2 border border-[#9A9A9A]">
          <Image
            src={mountImage}
            alt="Mountain thumbnail"
            fill
            className="object-cover"
          />
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="video">Video URL</Label>
            <Input id="video" placeholder="Enter video URL" className="border-[#9A9A9A]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Describe your submission" className="border-[#9A9A9A]" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#b3731d] hover:bg-[#b3731d]/90">
              Submit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitVideoDialog; 