import { Card } from "@/components/ui/card"
import {User, Users, Coins, Ticket } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import mountain from "@/assets/mount.webp"
import { ChallengeModel } from "@/lib/pb"
import { ChallengeDetailsProps } from "./challenge-details"

interface ChallengeCardProps {
  challenge: ChallengeModel;
}


const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  return (
    <Link href={`/challenge/${challenge.id}`}>
      <Card className="flex h-[180px] w-[400px] overflow-hidden bg-white p-4 gap-4 rounded-[30px] hover:shadow-lg transition-shadow border border-[#9A9A9A]">
        {/* Image container with fixed dimensions */}
        <div className="relative w-[120px] h-[140px] flex-shrink-0 rounded-2xl overflow-hidden">
          <Image
            src={challenge.image || mountain}
            alt={challenge.title}
            fill
            sizes="120px"
            className="object-cover"
            priority
            draggable={false}
          />
        </div>

        {/* Content Section with fixed width and ellipsis */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2 gap-2">
              <h3 className="font-semibold text-base text-ellipsis overflow-hidden whitespace-nowrap max-w-[180px]">
                {challenge.title}
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 h-[40px] overflow-hidden">
              {challenge.description}
            </p>
          </div>

          <div className="mt-auto">
            <div className="flex items-center mb-2">
              <User className="w-3.5 h-3.5 text-orange-500 mr-1 flex-shrink-0" />
              <span className="text-xs text-orange-500 truncate">
                {challenge.creator || 'Anonymous'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{challenge.reward || 0} CPT</span>
              </div>
              <div className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{challenge.voting_fee || 0} CPT</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{challenge.participants.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ChallengeCard;

