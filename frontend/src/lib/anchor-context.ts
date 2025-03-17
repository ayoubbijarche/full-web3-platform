'use client';

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider as AnchorSDKProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { createContext, useContext, useMemo } from "react";
import idl from "./idl.json";
import { 
  getAssociatedTokenAddressSync, 
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction 
} from "@solana/spl-token";

export const PROGRAM_ID = new PublicKey("7RUA3ry7n4ELZpMA4TwQBMmiHTKEhwSqML5xywM4m2pr");
export const PROGRAM_TREASURY = new PublicKey("FuFzoMF5xTwZego84fRoscnart4dPYNkpHho2UBe7NDt");
export const CPT_TOKEN_MINT = new PublicKey("mntjJeXswzxFCnCY1Zs2ekEzDvBVaVdyTVFXbBHfmo9");
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

function getAssociatedToken2022AddressSync(mint: PublicKey, owner: PublicKey): PublicKey {
  return getAssociatedTokenAddressSync(
    mint, 
    owner, 
    true,  // allowOwnerOffCurve
    TOKEN_2022_PROGRAM_ID  // programId
  );
}

// Define program account types
type ChallengeAccount = {
  creator: PublicKey;
  isActive: boolean;
  reward: anchor.BN;
  participationFee: anchor.BN;
  votingFee: anchor.BN;
  challengeTreasury: anchor.BN;
  votingTreasury: anchor.BN;
  winner: PublicKey | null;
  totalVotes: anchor.BN;
  winningVotes: anchor.BN;
  rewardTokenMint: PublicKey;
  participants: PublicKey[];
  maxParticipants: number;
};

// Define typed program interface
interface CoinpetitiveProgram extends Program<Idl> {
  account: {
    challenge: {
      fetch(address: PublicKey): Promise<ChallengeAccount>;
      // Add other methods you might use like fetchMultiple, all, etc.
    };
    // Add other account types if needed
  };
}

// Function to provide Anchor context values
export function useAnchorContextProvider(): AnchorContextType {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  
  // Convert undefined to null for type compatibility
  const wallet = anchorWallet || null;

  const program = useMemo(() => {
    if (!wallet || !connection) return null;

    const provider = new AnchorSDKProvider(
      connection,
      wallet, // Now this is either an AnchorWallet or null
      AnchorSDKProvider.defaultOptions()
    );

    return new Program(idl as unknown as Idl,  provider) as unknown as CoinpetitiveProgram;
  }, [wallet, connection]);

  const createChallenge = async ({ reward, participationFee, votingFee, maxParticipants = 50 }: { 
    reward: number, 
    participationFee: number, 
    votingFee: number,
    maxParticipants?: number 
  }) => {
    if (!program || !wallet) {
      throw new Error("Wallet not connected");
    }
  
    try {
      // Generate a new keypair for the challenge account
      const challengeKeypair = anchor.web3.Keypair.generate();
  
      // Find challenge token account
      const challengeTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        challengeKeypair.publicKey,
        false,  // allowOwnerOffCurve set to false
        TOKEN_2022_PROGRAM_ID  // use Token-2022 program
      );
  
      // Find user token account
      const userTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
  
      console.log("Creating challenge with parameters:", {
        reward: reward.toString(),
        participationFee: participationFee.toString(),
        votingFee: votingFee.toString(),
        challengePubkey: challengeKeypair.publicKey.toString(),
      });
  
      // Create the challenge
      const tx = await program.methods
        .createChallenge(
          new anchor.BN(reward),
          new anchor.BN(participationFee),
          new anchor.BN(votingFee),
          maxParticipants  // Pass max participants
        )
        .accounts({
          user: wallet.publicKey,
          challenge: challengeKeypair.publicKey,
          programAccount: PROGRAM_TREASURY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          tokenMint: CPT_TOKEN_MINT,
          creatorTokenAccount: userTokenAccount,
          challengeTokenAccount: challengeTokenAccount,
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        })
        .signers([challengeKeypair])
        .rpc();
  
      console.log("Challenge created! Transaction signature:", tx);
      return {
        success: true,
        signature: tx,
        challengePublicKey: challengeKeypair.publicKey.toString(), // This is the key name
      };
    } catch (error: unknown) {
      console.error("Error creating challenge:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };

  const participateInChallenge = async (challengePublicKey: string) => {
    if (!program || !wallet) {
      throw new Error("Wallet not connected");
    }
  
    try {
      // Convert string to PublicKey
      const challengePubkey = new PublicKey(challengePublicKey);
      
      // Get challenge data to verify it exists and check state
      const challengeAccount = await program.account.challenge.fetch(challengePubkey);
      
      // Log actual values for debugging
      console.log("On-chain challenge data:", {
        participants: challengeAccount.participants,
        participantsLength: challengeAccount.participants ? challengeAccount.participants.length : 0
      });
      
      // First check if there's a maxParticipants limit on-chain
      // Default to no limit (0) if not defined
      const maxParticipantsOnChain = challengeAccount.maxParticipants || 0;
      
      // Only check if a limit exists (greater than 0)
      if (maxParticipantsOnChain > 0 && 
          challengeAccount.participants && 
          challengeAccount.participants.length >= maxParticipantsOnChain) {
        return {
          success: false,
          error: "This challenge is already full on-chain."
        };
      }
      
      // Find the token accounts
      const participantTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      const challengeTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        challengePubkey,
        false, // allowOwnerOffCurve
        TOKEN_2022_PROGRAM_ID
      );
      
      console.log("Participating in challenge:", challengePublicKey);
      console.log("Challenge token account:", challengeTokenAccount.toString());
      console.log("Participant token account:", participantTokenAccount.toString());
      
      // Call the payParticipationFee instruction
      const tx = await program.methods
        .payParticipationFee()
        .accounts({
          participant: wallet.publicKey,
          challenge: challengePubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          participantTokenAccount: participantTokenAccount,
          challengeTokenAccount: challengeTokenAccount,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      console.log("Successfully participated in challenge! Transaction signature:", tx);
      return {
        success: true,
        signature: tx
      };
    } catch (error: unknown) {
      console.error("Error participating in challenge:", error);
      
      // Extract the specific Anchor error if it exists
      let errorMessage = "Failed to join challenge";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific Anchor errors
        if (errorMessage.includes("MaxParticipantsReached")) {
          errorMessage = "This challenge is already full. Please try another challenge.";
        } else if (errorMessage.includes("AlreadyParticipating")) {
          errorMessage = "You are already participating in this challenge.";
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Add this debug function to your anchor-context.ts
  const inspectChallengeAccount = async (challengePublicKey: string) => {
    if (!program) return null;
    
    try {
      const challengePubkey = new PublicKey(challengePublicKey);
      const challengeAccount = await program.account.challenge.fetch(challengePubkey);
      
      console.log("Challenge Account Details:", {
        reward: challengeAccount.reward.toString(),
        participationFee: challengeAccount.participationFee.toString(),
        votingFee: challengeAccount.votingFee.toString(),
        isActive: challengeAccount.isActive,
        maxParticipants: challengeAccount.maxParticipants,
        participants: challengeAccount.participants?.map(p => p.toString()),
        participantsCount: challengeAccount.participants?.length || 0
      });
      
      return challengeAccount;
    } catch (error) {
      console.error("Error inspecting challenge:", error);
      return null;
    }
  };

  return {
    wallet,  // Now this is correctly typed as anchor.Wallet | null
    program,
    createChallenge,
    participateInChallenge
  };
}

// Define the return type for our hook
export type AnchorContextType = {
  wallet: ReturnType<typeof useAnchorWallet> | null; // Use AnchorWallet type
  program: CoinpetitiveProgram | null;
  createChallenge: ({ reward, participationFee, votingFee }: { 
    reward: number;
    participationFee: number; 
    votingFee: number 
  }) => Promise<{
    success: boolean;
    signature?: string;
    challengePublicKey?: string;
    error?: string;
  }>;
  participateInChallenge: (challengePublicKey: string) => Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }>;
};

// Create the context with proper default value
export const AnchorContext = createContext<AnchorContextType | null>(null);

// Create a hook to use the context
export const useAnchor = () => {
  const context = useContext(AnchorContext);
  if (!context) {
    throw new Error("useAnchor must be used within an AnchorProvider");
  }
  return context;
};