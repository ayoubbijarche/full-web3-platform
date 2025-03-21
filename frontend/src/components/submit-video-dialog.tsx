"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import mountImage from '@/assets/mount2.png'
import { useState, useEffect } from "react"
import { submitVideo, useAuth } from "@/lib/pb"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAnchor } from '@/lib/anchor-context';
import { toast } from "sonner"; // Add this import

interface SubmitVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeId: string
  onChainId?: string  // Add this prop
  onSubmitSuccess?: () => void
  participationFee?: number;  // Add this
}

export function SubmitVideoDialog({ 
  open, 
  onOpenChange, 
  challengeId,
  onChainId,  // Add this prop
  participationFee,  // Add this prop
  onSubmitSuccess 
}: SubmitVideoDialogProps) {
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const auth = useAuth()
  const router = useRouter()
  const { submitVideoOnChain } = useAnchor();
  const [onChainSubmitting, setOnChainSubmitting] = useState(false);
  const [onChainError, setOnChainError] = useState<string | null>(null);

  // Generate embed URL from raw URLs (for preview)
  const getEmbedUrl = (url: string) => {
    try {
      if (!url) return "";
      
      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.includes('youtube.com') 
          ? url.split('v=')[1]?.split('&')[0]
          : url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      // Twitter
      else if (url.includes('twitter.com') || url.includes('x.com')) {
        return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
      }
      // Instagram
      else if (url.includes('instagram.com')) {
        return `https://www.instagram.com/embed/${url.split('/p/')[1]?.split('/')[0]}`;
      }
      // TikTok
      else if (url.includes('tiktok.com')) {
        return `https://www.tiktok.com/embed/${url.split('/video/')[1]}`;
      }
      // Return original URL if no matches
      return url;
    } catch {
      return url || "";
    }
  };

  // Update preview when URL changes
  useEffect(() => {
    setPreviewUrl(getEmbedUrl(videoUrl));
  }, [videoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // First, submit to blockchain if we have an onchain_id
      let videoReference = null;
      
      if (onChainId) {
        setOnChainSubmitting(true);
        const onChainResult = await submitVideoOnChain(
          onChainId, 
          videoUrl || ''
        );
        
        if (onChainResult.success) {
          videoReference = onChainResult.videoReference;
          console.log("Video submitted on-chain with reference:", videoReference);
        } else {
          setError(onChainResult.error || 'Failed to submit video on-chain');
          setIsSubmitting(false);
          setOnChainSubmitting(false);
          return;
        }
        setOnChainSubmitting(false);
      }
      
      // Then submit to database
      const result = await submitVideo(challengeId, {
        description,
        videoUrl: videoUrl || '',
        onchain_id: videoReference || undefined  // Convert null to undefined
      });
      
      if (result.success) {
        toast.success("Video submitted successfully!");
        
        // Clear form and close dialog
        setDescription("");
        setVideoUrl("");
        
        // Only call onSubmitSuccess if it exists
        if (typeof onSubmitSuccess === 'function') {
          onSubmitSuccess();
        }
        
        onOpenChange(false);
      } else {
        setError(result.error || 'Failed to submit video');
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
            <iframe 
              src={previewUrl} 
              className="w-full h-full object-cover" 
              allowFullScreen
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
              <p className="text-sm text-gray-500">No video URL entered</p>
            </div>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input 
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="border-[#9A9A9A]"
            />
            <p className="text-xs text-gray-500">
              Enter YouTube, Twitter, Instagram, or TikTok video URL
            </p>
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
                `Submit (${participationFee || "..."} CPT)`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SubmitVideoDialog;