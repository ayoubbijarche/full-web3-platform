'use client';

import { ReactNode } from 'react';
import { AnchorContext, useAnchorContextProvider } from './anchor-context';

// Provider component to wrap the app
type AnchorProviderProps = {
  children: ReactNode;
};

export function AnchorProvider({ children }: AnchorProviderProps) {
  const contextValue = useAnchorContextProvider();
  
  return (
    <AnchorContext.Provider value={contextValue}>
      {children}
    </AnchorContext.Provider>
  );
}