'use client'
'use client'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl, Connection, Commitment } from '@solana/web3.js' // Import Commitment
import { useMemo, useCallback } from 'react'

require('@solana/wallet-adapter-react-ui/styles.css')

// List of backup RPC endpoints for better reliability
const RPC_ENDPOINTS = {
  devnet: [
    process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
    'https://solana-devnet-rpc.allthatnode.com',
    'https://devnet.genesysgo.net'
  ],
  mainnet: [
    'https://api.mainnet-beta.solana.com',
    'https://solana-mainnet-rpc.allthatnode.com',
    'https://ssc-dao.genesysgo.net'
  ]
}

export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet
  
  // Use multiple RPC endpoints for better reliability
  // Since network is hardcoded to Devnet, directly use the devnet endpoints.
  const endpoint = useMemo(() => {
    const endpoints = RPC_ENDPOINTS.devnet;
    
    return endpoints[0]; // Start with the first endpoint
  }, []) // network dependency can be removed as it's constant
  // Enhanced connection config with better timeout and confirmation settings
  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed' as Commitment, // Cast to Commitment type
    confirmTransactionInitialTimeout: 180000, // Increased to 3 minutes
    wsEndpoint: endpoint.replace('https', 'wss'), // Add WebSocket endpoint
    confirmationStrategy: {
      skipPreflight: false, // Enable preflight checks
      maxRetries: 5, // Increased retries
      searchTransactionRetryIntervalMs: 2000, // Increased interval
    }
  }), [endpoint])
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  // Add error handling for connection
  const handleConnectionError = useCallback((error: any) => {
    console.error('Connection error:', error);
    // Implement connection fallback logic here
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect 
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