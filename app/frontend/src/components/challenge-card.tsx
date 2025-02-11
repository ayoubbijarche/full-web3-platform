import { User, Video, Clock, Ticket } from "lucide-react"
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
          
          <div className="flex flex-col gap-1.5">
            {/* User and Points */}
            <div className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-[#b3731d]" />
              <span className="text-gray-600">Steven</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#b3731d]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 7L11.8845 4.76892C11.5634 4.1268 11.4029 3.80573 11.1634 3.57116C10.9516 3.36373 10.6963 3.20597 10.4161 3.10931C10.0992 3 9.74021 3 9.02229 3H5.2C4.0799 3 3.51984 3 3.09202 3.21799C2.71569 3.40973 2.40973 3.71569 2.21799 4.09202C2 4.51984 2 5.0799 2 6.2V7M2 7H17.2C18.8802 7 19.7202 7 20.362 7.32698C20.9265 7.6146 21.3854 8.07354 21.673 8.63803C22 9.27976 22 10.1198 22 11.8V16.2C22 17.8802 22 18.7202 21.673 19.362C21.3854 19.9265 20.9265 20.3854 20.362 20.673C19.7202 21 18.8802 21 17.2 21H6.8C5.11984 21 4.27976 21 3.63803 20.673C3.07354 20.3854 2.6146 19.9265 2.32698 19.362C2 18.7202 2 17.8802 2 16.2V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[#b3731d] font-medium">100K</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center text-[10px] text-gray-500">
              <div className="flex items-center gap-0.5">
                <Video className="h-3 w-3" />
                <span>1500</span>
              </div>
              <span className="mx-1.5 text-gray-300">|</span>
              <div className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                <span>15M+</span>
              </div>
              <span className="mx-1.5 text-gray-300">|</span>
              <div className="flex items-center gap-0.5">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L14 14M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>15M+</span>
              </div>
              <span className="mx-1.5 text-gray-300">|</span>
              <div className="flex items-center gap-0.5">
                <Ticket className="h-3 w-3" />
                <span>15M+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 