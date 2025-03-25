'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Loader2, LogOut, Wallet } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function WalletConnection() {
  const { publicKey, connecting, disconnect } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (publicKey) {
      toast({
        title: "Connected",
        description: `Wallet ${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)} connected`,
      })
    }
  }, [publicKey])

  const handleDisconnect = async () => {
    try {
      await disconnect()
      toast({
        title: "Disconnected",
        description: "Wallet disconnected successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      })
    }
  }

  if (!mounted) return null

  return (
    <div className="flex items-center gap-2">
      {publicKey ? (
        <>
          <Button
            variant="outline"
            className="bg-[#b3731d] text-white hover:bg-[#b3731d]/90 border-none"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </Button>
          <Button
            variant="outline"
            className="bg-red-600 text-white hover:bg-red-700 border-none"
            onClick={handleDisconnect}
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </>
      ) : (
        <WalletMultiButton
          className={cn(
            "wallet-adapter-button",
            "bg-[#b3731d] hover:bg-[#b3731d]/90",
            "text-white font-medium",
            "rounded-md px-4 py-2",
            "flex items-center gap-2",
            "transition-colors"
          )}
        >
          {connecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          Connect Wallet
        </WalletMultiButton>
      )}
    </div>
  )
}