'use client'

import { useAuth } from "@/lib/pb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { signOut } from "@/lib/pb"

export function UserMenu() {
  const auth = useAuth()

  if (!auth.isAuthenticated || !auth.users) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-3 border rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {auth.users.avatar && (
              <Image
                src={`http://127.0.0.1:8090/api/files/users/${auth.users.id}/${auth.users.avatar}`}
                alt={`${auth.users.username}'s avatar`}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            )}
          </div>
          <span className="text-sm font-medium">{auth.users.username}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" asChild>
          <Link href="/create-challenge">
            <Settings className="mr-2 h-4 w-4" />
            Create Challenge
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600" 
          onClick={() => {
            signOut();
            window.location.reload();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
