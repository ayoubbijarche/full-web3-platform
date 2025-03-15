'use client'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { useMemo } from 'react'

require('@solana/wallet-adapter-react-ui/styles.css')

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet
  
  // Use multiple RPC endpoints for better reliability
  const endpoint = useMemo(() => {
    // Default Solana Devnet endpoint
    const defaultEndpoint = clusterApiUrl(network)
    
    // Can add additional backup endpoints if needed
    return defaultEndpoint
  }, [network])
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect 
        // Configure additional connection options
        onError={(error) => {
          console.error('Wallet connection error:', error)
        }}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}