'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/pb'
import { SignInDialog } from './sign-in-dialog'
import Image from 'next/image'
import logo from '@/assets/logo.png'
import { UserAvatarMenu } from './user-avatar-menu'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Wallet, User } from "lucide-react"
import { subscribeToAuth } from '@/lib/pb'
import { WalletConnectionDialog } from './wallet-connection-dialog'
import { WalletConnection } from './wallet-connection'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeToAuth(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  if (!mounted) {
    return null
  }

  return (
    <div className="flex flex-col items-center">
      <nav className="w-full">
        <div className="flex h-20 items-center px-8 container mx-auto">
          <Link href="/" className="flex items-center gap-4">
            <Image
              src={logo}
              alt="Coinpetitive Logo"
              width={48}
              height={48}
            />
            <span className="font-bold text-2xl uppercase text-[#b3731d]">Coinpetitive</span>
          </Link>

          <div className="ml-auto flex items-center space-x-4">
            <WalletConnection />
            {user ? (
              <UserAvatarMenu 
                user={{
                  username: user.username,
                  email: user.email,
                  avatarUrl: user.avatar ? `http://127.0.0.1:8090/api/files/users/${user.id}/${user.avatar}` : undefined
                }}
                onSignOut={signOut}
              />
            ) : (
              <>
                <Button 
                  onClick={() => setIsSignInOpen(true)}
                  className="font-bold"
                >
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
                <SignInDialog 
                  open={isSignInOpen} 
                  onOpenChange={setIsSignInOpen} 
                />
              </>
            )}
          </div>
        </div>
      </nav>
      <div className="w-[80%] h-[1px] bg-black" />
    </div>
  )
}
