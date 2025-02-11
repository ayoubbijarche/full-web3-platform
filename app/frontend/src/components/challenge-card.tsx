import { User } from "lucide-react"
import Image from "next/image"

export function ChallengeCard() {
  return (
    <div className="rounded-[30px] bg-white p-5 shadow-sm hover:shadow-md transition-shadow h-[180px] border border-[#8a8a8a]">
      <div className="flex gap-4 h-full">
        {/* Image */}
        <div className="relative h-[140px] w-[120px] flex-shrink-0 overflow-hidden rounded-2xl">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%20from%202025-02-11%2001-24-43-gClthFtHYhJ0yDWsdseS0VT4c5TfWv.png"
            alt="Mountain Climbing"
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-gray-800 truncate">Mountain Climbing Challenge</h3>
            <div className="h-2 w-2 rounded-full bg-green-400 flex-shrink-0 ml-2" />
          </div>
          
          <p className="text-sm text-gray-500 line-clamp-2 mb-auto">Lorem Ipsum is simply dummy text of the printing and typesetting industry.</p>
          
          <div className="flex items-center justify-between w-full text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="h-3.5 w-3.5 text-gray-600 flex-shrink-0" />
              <span className="text-gray-600 truncate">Steven</span>
              <span className="font-medium text-[#b3731d] flex-shrink-0">100K</span>
            </div>
            
            <div className="flex items-center gap-3 text-gray-600 flex-shrink-0">
              <span>1500</span>
              <span>15M+</span>
              <span>15M+</span>
              <span>15M+</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 