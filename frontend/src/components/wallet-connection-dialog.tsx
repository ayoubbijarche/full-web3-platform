'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAnchorWallet, useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalButton } from '@solana/wallet-adapter-react-ui'

export function WalletConnectionDialog() {
  const { connection } = useConnection()
  const { publicKey, connecting, disconnect } = useWallet()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (publicKey) {
      toast({
        title: "Wallet Connected",
        description: `Connected: ${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`,
      })
      setIsOpen(false)
    }
  }, [publicKey])

  const handleDisconnect = async () => {
    await disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {publicKey ? (
          <div className="flex gap-2">
            <Button 
              className="bg-[#b3731d] text-white hover:bg-[#b3731d]/80"
              onClick={(e) => {
                e.preventDefault()
                setIsOpen(true)
              }}
            >
              <Wallet className="mr-2 h-4 w-4" />
              {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </Button>
            <Button 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            className="bg-[#b3731d] text-white hover:bg-[#b3731d]/80"
            onClick={() => setIsOpen(true)}
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
        
        {publicKey ? (
          <div className="flex flex-col items-center gap-4 p-4">
            <Alert className="mb-4 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Connected</AlertTitle>
              <AlertDescription className="font-mono">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </AlertDescription>
            </Alert>
            
            <WalletModalButton className="wallet-adapter-button w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <WalletModalButton className="wallet-adapter-button w-full" />
            
            {connecting && (
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