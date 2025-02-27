'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type WalletType = 'phantom' | 'solflare' | null;

export function WalletConnectionDialog() {
  const [mounted, setMounted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletType, setWalletType] = useState<WalletType>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  // Wait for component to mount to avoid hydration errors
  useEffect(() => {
    setMounted(true)
    
    // Check if wallet is already connected
    const checkWalletConnection = async () => {
      try {
        if (typeof window !== 'undefined') {
          const { solana } = window as any
          if (solana?.isPhantom && solana.isConnected) {
            setWalletType('phantom')
            setPublicKey(solana.publicKey.toString())
          }
          
          const { solflare } = window as any
          if (solflare?.isSolflare && solflare.isConnected) {
            setWalletType('solflare')
            setPublicKey(solflare.publicKey.toString())
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
    
    checkWalletConnection()
  }, [])

  const connectPhantom = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      if (typeof window !== 'undefined') {
        const { solana } = window as any

        if (solana?.isPhantom) {
          try {
            const response = await solana.connect()
            setPublicKey(response.publicKey.toString())
            setWalletType('phantom')
            
            toast({
              title: "Wallet Connected",
              description: `Connected to Phantom: ${response.publicKey.toString().slice(0, 8)}...${response.publicKey.toString().slice(-8)}`,
            })
            
            // Close dialog after successful connection
            setTimeout(() => setIsOpen(false), 1500)
          } catch (err) {
            console.error('Error connecting to Phantom:', err)
            setError('Failed to connect to Phantom wallet. User may have rejected the request.')
          }
        } else {
          window.open('https://phantom.app/', '_blank')
          setError('Phantom wallet not detected. Please install Phantom wallet extension.')
        }
      }
    } catch (error) {
      console.error('Error connecting to Phantom wallet:', error)
      setError('An unexpected error occurred while connecting to Phantom wallet.')
    } finally {
      setIsConnecting(false)
    }
  }

  const connectSolflare = async () => {
    try {
      setIsConnecting(true)
      setError(null)
      
      if (typeof window !== 'undefined') {
        const { solflare } = window as any

        if (solflare?.isSolflare) {
          try {
            const response = await solflare.connect()
            setPublicKey(response.publicKey.toString())
            setWalletType('solflare')
            
            toast({
              title: "Wallet Connected",
              description: `Connected to Solflare: ${response.publicKey.toString().slice(0, 8)}...${response.publicKey.toString().slice(-8)}`,
            })
            
            // Close dialog after successful connection
            setTimeout(() => setIsOpen(false), 1500)
          } catch (err) {
            console.error('Error connecting to Solflare:', err)
            setError('Failed to connect to Solflare wallet. User may have rejected the request.')
          }
        } else {
          window.open('https://solflare.com/', '_blank')
          setError('Solflare wallet not detected. Please install Solflare wallet extension.')
        }
      }
    } catch (error) {
      console.error('Error connecting to Solflare wallet:', error)
      setError('An unexpected error occurred while connecting to Solflare wallet.')
    } finally {
      setIsConnecting(false)
    }
  }
  
  const disconnectWallet = async () => {
    try {
      if (typeof window !== 'undefined') {
        if (walletType === 'phantom') {
          const { solana } = window as any
          if (solana?.isPhantom) {
            await solana.disconnect()
          }
        } else if (walletType === 'solflare') {
          const { solflare } = window as any
          if (solflare?.isSolflare) {
            await solflare.disconnect()
          }
        }
        
        setPublicKey(null)
        setWalletType(null)
        
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected.",
        })
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {publicKey ? (
          <Button 
            className="bg-[#b3731d] text-white hover:bg-[#b3731d]/80"
            onClick={(e) => {
              e.preventDefault()
              setIsOpen(true)
            }}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
          </Button>
        ) : (
          <Button 
            className="bg-[#b3731d] text-white hover:bg-[#b3731d]/80"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-4">
            {publicKey ? 'Wallet Connected' : 'Connect Wallet'}
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {publicKey ? (
          <div className="flex flex-col items-center gap-4 p-4">
            <Alert className="mb-4 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Connected to {walletType === 'phantom' ? 'Phantom' : 'Solflare'}</AlertTitle>
              <AlertDescription className="font-mono">
                {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
              </AlertDescription>
            </Alert>
            
            <Button
              variant="destructive"
              className="w-full"
              onClick={disconnectWallet}
            >
              Disconnect Wallet
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <Button
              variant="outline"
              className="flex items-center justify-between p-6 hover:border-[#b3731d]"
              onClick={connectPhantom}
              disabled={isConnecting}
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
              disabled={isConnecting}
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
            
            {isConnecting && (
              <div className="text-center py-2">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#b3731d]"></div>
                <p className="mt-2 text-sm text-gray-500">Connecting to wallet...</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}