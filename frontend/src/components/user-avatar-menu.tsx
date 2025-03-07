'use client'

import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface UserAvatarMenuProps {
  user: {
    username: string;
    email: string;
    avatarUrl?: string;
  };
  onSignOut: () => void;
}

export function UserAvatarMenu({ user, onSignOut }: UserAvatarMenuProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await onSignOut();
    router.refresh(); // Refresh the page after signing out
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative flex items-center justify-start w-40 px-3 py-2 rounded-full bg-white shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.avatarUrl} 
              alt={user.username} 
            />
            <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium ml-3 text-sm">{user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-48 mt-2 bg-white rounded-xl border-none shadow-lg" 
        align="end"
      >
        <DropdownMenuItem className="font-normal focus:bg-[#b3731d]/10">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="focus:bg-[#b3731d]/10" asChild>
          <Link href="/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="focus:bg-[#b3731d]/10 focus:text-[#b3731d]"
          onClick={handleSignOut}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}