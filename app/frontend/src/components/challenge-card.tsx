import { Card } from "@/components/ui/card"
import { User, Eye, ThumbsUp, MessageSquare, Coins } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ChallengeCard() {
  return (
    <Link href="/challenge/1">
    <Card className="flex w-full max-w-md overflow-hidden bg-white p-4 gap-4 rounded-[30px] hover:shadow-lg transition-shadow">
      {/* Image Section */}
      <div className="relative w-1/3 min-w-[100px] aspect-square rounded-2xl overflow-hidden">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Challenge%20Card%20(1)-wZG2CFTpfkEnK6LJqPOnluInchNV2M.png"
          alt="Mountain climbing silhouette"
          fill
          className="object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-base sm:text-lg truncate pr-4">Mountain Climbing Challenge</h3>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
          </p>
        </div>

        <div>
          <div className="flex items-center mb-3">
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 mr-1" />
            <span className="text-xs sm:text-sm text-orange-500">Steven</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <div className="flex items-center gap-0.5">
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>1500</span>
            </div>
            <div className="flex items-center gap-0.5">
              <ThumbsUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>15M+</span>
            </div>
            <div className="flex items-center gap-0.5">
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>15M+</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>15M+</span>
            </div>
          </div>
        </div>
      </div>
    </Card></Link>
  )
}

