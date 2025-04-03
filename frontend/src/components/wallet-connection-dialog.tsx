'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet, AlertCircle, CheckCircle2, ExternalLink, Copy, LogOut } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletModalButton } from '@solana/wallet-adapter-react-ui'
import { cn } from "@/lib/utils"

export function WalletConnectionDialog() {
  const { connection } = useConnection()
  const { publicKey, connecting, disconnect } = useWallet()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (publicKey) {
      toast({
        title: "Wallet Connected",
        description: `Connected: ${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`,
      })
      
      // Fetch SOL balance
      connection.getBalance(publicKey).then(balance => {
        setBalance(balance / 1000000000); // Convert lamports to SOL
      }).catch(err => {
        console.error('Failed to fetch balance:', err);
      });
      
      setIsOpen(false)
    }
  }, [publicKey, connection])

  const handleDisconnect = async () => {
    await disconnect();
    setBalance(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };
  
  // Copy wallet address to clipboard
  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };
  
  // View address on explorer
  const viewOnExplorer = () => {
    if (publicKey) {
      window.open(`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`, '_blank');
    }
  };

  if (!mounted) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {publicKey ? (
          <Button 
            className={cn(
              "bg-gradient-to-r from-[#e0b36c] to-[#b3731d] text-white rounded-xl px-4 py-2",
              "relative flex items-center gap-2 hover:shadow-md transition-all"
            )}
            onClick={(e) => {
              e.preventDefault()
              setIsOpen(true)
            }}
          >
            <Wallet className="h-4 w-4" />
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </Button>
        ) : (
          <WalletModalButton className="wallet-connection-button">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </WalletModalButton>
        )}
      </DialogTrigger>
      
      {publicKey && (
        <DialogContent className="sm:max-w-[425px] p-0 rounded-xl overflow-hidden">
          <DialogHeader className="p-6 bg-gradient-to-r from-[#e0b36c] to-[#b3731d]">
            <DialogTitle className="text-center text-2xl font-bold text-white">
              Wallet Connected
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            {/* Wallet Address */}
            <div className="bg-[#faf2e7] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 font-medium">Wallet Address</span>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    onClick={viewOnExplorer}
                  >
                    <ExternalLink className="h-4 w-4 text-gray-500" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0" 
                    onClick={copyAddress}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
              
              <code className="bg-white rounded-lg px-3 py-2 text-sm font-mono text-[#b3731d] block truncate">
                {publicKey.toString()}
              </code>
            </div>
            
            {/* Wallet Balance */}
            <div className="bg-[#faf2e7] p-4 rounded-xl">
              <div className="mb-2">
                <span className="text-sm text-gray-500 font-medium">Balance</span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="bg-white w-6 h-6 rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 128 128" fill="none">
                    <path d="M92.6 61.1L66.5 35.5L64.2 33.2L36.7 61.1L64.2 89.4L92.5 61.1H92.6Z" fill="black"/>
                    <path d="M64.2 97.4L36.7 69.2L28.2 78.3L64.2 113.8L100.2 78.3L91.4 69.2L64.2 97.4Z" fill="black"/>
                    <path d="M64.2 25.2L100.2 61.1L91.4 70.2L64.2 42L36.7 69.9L28.2 61.1L64.2 25.2Z" fill="black"/>
                  </svg>
                </div>
                <span className="font-medium">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : "Loading..."}
                </span>
              </div>
            </div>
            
            {/* Disconnect Button */}
            <Button 
              variant="outline" 
              className="border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 w-full"
              onClick={handleDisconnect}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}