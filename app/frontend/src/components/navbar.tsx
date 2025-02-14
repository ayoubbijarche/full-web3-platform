'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/pb'
import { SignInDialog } from './sign-in-dialog'
import Image from 'next/image'
import logo from '@/assets/logo.png'
import { UserAvatarMenu } from './user-avatar-menu'
import { useEffect, useState } from 'react'

export function Navbar() {
  const { users, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null // or a loading skeleton
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
            {users ? (
              <UserAvatarMenu 
                user={users} 
                onSignOut={signOut}
              />
            ) : (
              <SignInDialog />
            )}
          </div>
        </div>
      </nav>
      <div className="w-[80%] h-[1px] bg-black" />
    </div>
  )
}
