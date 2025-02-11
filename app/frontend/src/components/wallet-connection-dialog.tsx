'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"

export function WalletConnectionDialog() {
  const [mounted, setMounted] = useState(false)
  
  // Wait for component to mount to avoid hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  const connectPhantom = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { solana } = window as any

        if (solana?.isPhantom) {
          const response = await solana.connect()
          console.log('Connected with Public Key:', response.publicKey.toString())
        } else {
          window.open('https://phantom.app/', '_blank')
        }
      }
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error)
    }
  }

  const connectSolflare = async () => {
    try {
      if (typeof window !== 'undefined') {
        const { solflare } = window as any

        if (solflare?.isSolflare) {
          const response = await solflare.connect()
          console.log('Connected with Public Key:', response.publicKey.toString())
        } else {
          window.open('https://solflare.com/', '_blank')
        }
      }
    } catch (error) {
      console.error('Error connecting to Solflare wallet:', error)
    }
  }

  if (!mounted) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="font-bold border-2 border-[#b3731d] text-[#b3731d] hover:bg-[#b3731d] hover:text-white"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-4">
            Connect Wallet
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <Button
            variant="outline"
            className="flex items-center justify-between p-6 hover:border-[#b3731d]"
            onClick={connectPhantom}
          >
            <span className="text-lg font-semibold">Phantom</span>
            <Image
              src="https://phantom.app/img/phantom-logo.svg"
              alt="Phantom"
              width={32}
              height={32}
              className="rounded-full"
            />
          </Button>
          <Button
            variant="outline"
            className="flex items-center justify-between p-6 hover:border-[#b3731d]"
            onClick={connectSolflare}
          >
            <span className="text-lg font-semibold">Solflare</span>
            <Image
              src="https://solflare.com/assets/logo.svg"
              alt="Solflare"
              width={32}
              height={32}
              className="rounded-full"
            />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 