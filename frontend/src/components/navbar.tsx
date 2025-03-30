'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/pb'
import { SignInDialog } from './sign-in-dialog'
import Image from 'next/image'
import logo from '@/assets/logo.png'
import { UserAvatarMenu } from './user-avatar-menu'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Wallet, User, Menu, X } from "lucide-react"
import { subscribeToAuth } from '@/lib/pb'
import { WalletConnection } from './wallet-connection'
import { WalletConnectionDialog } from './wallet-connection-dialog'

export function Navbar() {
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [isSignInOpen, setIsSignInOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <div className="flex flex-col items-center w-full">
      <nav className="w-full">
        <div className="flex h-16 sm:h-20 items-center px-4 sm:px-8 container mx-auto">
          <Link href="/" className="flex items-center gap-2 sm:gap-4">
            <Image
              src={logo}
              alt="Coinpetitive Logo"
              width={36}
              height={36}
              className="w-8 h-8 sm:w-12 sm:h-12"
            />
            <span className="font-bold text-xl sm:text-2xl uppercase text-[#b3731d]">Coinpetitive</span>
          </Link>

          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>

          {/* Desktop navigation */}
          <div className="hidden sm:flex ml-auto items-center space-x-4">
            <WalletConnection />
            
            {user ? (
              <UserAvatarMenu 
                user={{
                  username: user.username,
                  email: user.email,
                  avatarUrl: user.avatar ? `https://api.coinpetitive.com/api/files/users/${user.id}/${user.avatar}` : undefined
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
              </>
            )}
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="px-4 py-4 sm:hidden bg-white border-t border-gray-200 shadow-md">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded-md">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 relative">
                    {user.avatar ? (
                      <Image
                        src={`https://api.coinpetitive.com/api/files/users/${user.id}/${user.avatar}`}
                        alt={user.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-full h-full p-2 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <Link 
                  href="/profile" 
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                
                <Link 
                  href="/create-challenge" 
                  className="block w-full text-left px-3 py-2 rounded-md hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Challenge
                </Link>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start font-normal hover:bg-gray-100 hover:text-red-600"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                className="w-full"
                onClick={() => {
                  setIsSignInOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        )}
      </nav>
      
      {/* Line separator */}
      <div className="w-[80%] h-[1px] bg-black mt-1" />
      
      {/* Sign in dialog */}
      <SignInDialog 
        open={isSignInOpen} 
        onOpenChange={setIsSignInOpen} 
      />
    </div>
  )
}
