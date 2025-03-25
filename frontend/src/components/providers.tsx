'use client'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from './ui/toaster'

require('@solana/wallet-adapter-react-ui/styles.css')

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet
  const [autoConnect, setAutoConnect] = useState(false)
  
  // Use reliable RPC endpoint
  const endpoint = useMemo(() => {
    return "https://api.devnet.solana.com" // Use direct URL instead of clusterApiUrl
  }, [network])
  
  // Use empty array for wallets
  const wallets = useMemo(() => [], [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider 
          wallets={wallets}
          autoConnect={autoConnect} 
          onError={(error) => {
            console.error('Wallet connection error:', error)
          }}>
          <WalletModalProvider>
            {children}
            <Toaster />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  )
}