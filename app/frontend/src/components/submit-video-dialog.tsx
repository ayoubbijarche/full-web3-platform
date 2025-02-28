"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import mountImage from '@/assets/mount2.png'
import { useState, useRef } from "react"
import { submitVideo, useAuth } from "@/lib/pb"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// Update the interface to include onSubmitSuccess
interface SubmitVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeId: string
  onSubmitSuccess?: () => void  // Add this line
}

// Update the component to include the new prop
export function SubmitVideoDialog({ 
  open, 
  onOpenChange, 
  challengeId,
  onSubmitSuccess 
}: SubmitVideoDialogProps) {
  const [description, setDescription] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const auth = useAuth()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      
      // Create preview URL for video thumbnail
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoFile) {
      setError("Please select a video file")
      return
    }
    
    if (!description.trim()) {
      setError("Please provide a description")
      return
    }
    
    setError(null)
    setIsSubmitting(true)
    
    try {
      const result = await submitVideo(challengeId, {
        description: description.trim(),
        video: videoFile
      })
      
      if (result.success) {
        setDescription("")
        setVideoFile(null)
        setPreviewUrl(null)
        onOpenChange(false)
        onSubmitSuccess?.() // Call the success callback
        router.refresh()
      } else {
        setError(result.error || "Failed to submit video")
      }
    } catch (error) {
      setError("An unexpected error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Video</DialogTitle>
        </DialogHeader>
        
        {/* Video Preview */}
        <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2 border border-[#9A9A9A] flex items-center justify-center">
          {previewUrl ? (
            <video 
              src={previewUrl} 
              className="w-full h-full object-cover" 
              controls
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <Image
                src={mountImage}
                alt="Video placeholder"
                width={64}
                height={64}
                className="opacity-50 mb-2"
              />
              <p className="text-sm text-gray-500">No video selected</p>
            </div>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="video">Upload Video</Label>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={triggerFileInput}
              className="w-full border-dashed border-2 h-20 flex flex-col items-center justify-center"
            >
              <span className="text-sm">Click to select video file</span>
              <span className="text-xs text-gray-500 mt-1">
                {videoFile ? videoFile.name : "MP4, WebM, or other video formats"}
              </span>
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe your submission" 
              className="border-[#9A9A9A]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-[#b3731d] hover:bg-[#b3731d]/90"
              disabled={isSubmitting || !auth.isAuthenticated}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitVideoDialog;