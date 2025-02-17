import { Card } from "@/components/ui/card"
import { User, Eye, ThumbsUp, MessageSquare, Coins } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import mountain from "@/assets/mount.png"

interface ChallengeCardProps {
  challenge: {
    id: number;
    title: string;
    description: string;
    isCreator?: boolean;
  }
}

const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  return (
    <Link href={`/challenge/${challenge.id}`}>
      <Card className="flex w-full max-w-md overflow-hidden bg-white p-4 gap-4 rounded-[30px] hover:shadow-lg transition-shadow border border-[#9A9A9A]">
        {/* Image Section */}
        <div className="relative w-1/3 min-w-[100px] aspect-square rounded-2xl overflow-hidden">
          <Image
            src={mountain}
            alt="Mountain climbing silhouette"
            fill
            className="object-cover"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-between rounded-xl p-2">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-base sm:text-lg truncate pr-4">{challenge.title}</h3>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
              {challenge.description}
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-center mb-3">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 mr-1" />
              <span className="text-xs sm:text-sm text-orange-500">Steven</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs rounded-lg p-1.5">
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
      </Card>
    </Link>
  )
}

export default ChallengeCard

