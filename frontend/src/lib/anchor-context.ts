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

export const PROGRAM_ID = new PublicKey("gkWKee4XRKyNFzWmQMjfG945iTJmJLF4f5je2qyPAmM");
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
  // Add these new fields to match your updated Rust struct
  submissionVotes: [PublicKey, anchor.BN][]; // (submission_id, votes)
  voters: [PublicKey, PublicKey][]; // (voter, submission_id)
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
    if (!wallet) {
      return {
        success: false,
        error: "Wallet not connected"
      };
    }
    
    if (!program) {
      return {
        success: false,
        error: "Program not initialized"
      };
    }
  
    try {
      // Convert string to PublicKey
      const challengePubkey = new PublicKey(challengePublicKey);
      
      // Skip fetching the challenge account data which is causing the error
      // We'll directly call the instruction instead
      
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
      
      // Call the payParticipationFee instruction directly
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

  // Add this function to useAnchorContextProvider
  const submitVideoOnChain = async (challengePublicKey: string, videoUrl: string) => {
    if (!wallet) {
      return {
        success: false,
        error: "Wallet not connected"
      };
    }
    
    if (!program) {
      return {
        success: false,
        error: "Program not initialized"
      };
    }
  
    try {
      // Skip the check that's causing problems - it's not needed
      // if (!program.account || !program.account.challenge) {
      //   console.error("Program not fully initialized:", program);
      //   return {
      //     success: false,
      //     error: "Program not ready. Please refresh and try again."
      //   };
      // }
      
      // Convert string to PublicKey
      const challengePubkey = new PublicKey(challengePublicKey);
      console.log("Submitting to challenge public key:", challengePubkey.toString());
      
      // Find token accounts
      const participantTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      const challengeTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        challengePubkey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Create a reference for this video submission
      const videoReference = anchor.web3.Keypair.generate().publicKey;
      
      // Call the submit_video instruction directly
      const tx = await program.methods
        .submitVideo(videoUrl)
        .accounts({
          participant: wallet.publicKey,
          challenge: challengePubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          participantTokenAccount: participantTokenAccount,
          challengeTokenAccount: challengeTokenAccount,
          videoReference: videoReference,
        })
        .rpc();
      
      return {
        success: true,
        signature: tx,
        videoReference: videoReference.toString()
      };
    } catch (error: unknown) {
      console.error("Error submitting video on-chain:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Add this debug function to your anchor-context.ts
  const debugChallengeOnChain = async (challengePublicKey: string) => {
    if (!program || !connection) {
      console.error("Program or connection not initialized");
      return { success: false, error: "Program not initialized" };
    }
    
    try {
      console.log("🔍 DEBUG: Fetching challenge data for", challengePublicKey);
      const challengePubkey = new PublicKey(challengePublicKey);
      
      // Fetch the challenge account data
      const challengeAccount = await program.account.challenge.fetch(challengePubkey);
      
      // Format the participants data
      const participants = challengeAccount.participants?.map(p => p.toString()) || [];
      const participantsCount = participants.length;
      const maxParticipants = challengeAccount.maxParticipants;
      
      // Format token amounts with proper decimal places
      const reward = challengeAccount.reward.toString();
      const participationFee = challengeAccount.participationFee.toString();
      const votingFee = challengeAccount.votingFee.toString();
      const challengeTreasury = challengeAccount.challengeTreasury.toString();
      const votingTreasury = challengeAccount.votingTreasury.toString();
      
      // Get recent transactions for this account
      const signatures = await connection.getSignaturesForAddress(challengePubkey, { limit: 10 });
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            return {
              signature: sig.signature,
              blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Unknown',
              err: sig.err ? 'Failed' : 'Success',
              sender: tx?.transaction.message.getAccountKeys?.().get(0)?.toString() || 'Unknown'
            };
          } catch (e) {
            return {
              signature: sig.signature,
              blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Unknown',
              err: 'Error fetching transaction',
              sender: 'Unknown'
            };
          }
        })
      );
      
      // Format and return all data
      const debugData = {
        success: true,
        challengeDetails: {
          address: challengePubkey.toString(),
          creator: challengeAccount.creator.toString(),
          isActive: challengeAccount.isActive,
          reward,
          participationFee,
          votingFee,
          challengeTreasury,
          votingTreasury,
          winner: challengeAccount.winner?.toString() || 'Not set',
          totalVotes: challengeAccount.totalVotes.toString(),
          winningVotes: challengeAccount.winningVotes.toString(),
          rewardTokenMint: challengeAccount.rewardTokenMint.toString(),
          participants: {
            count: participantsCount,
            max: maxParticipants,
            addresses: participants
          },
          // Add these directly in the object
          submissions: challengeAccount.submissionVotes 
            ? challengeAccount.submissionVotes.map(([pubkey, votes]) => ({
                submissionId: pubkey.toString(),
                votes: votes.toString()
              }))
            : [],
          votes: challengeAccount.voters
            ? challengeAccount.voters.map(([voter, submission]) => ({
                voter: voter.toString(),
                submission: submission.toString()
              }))
            : []
        },
        recentTransactions: transactions,
      };
      
      console.log("📊 Challenge Debug Information:", debugData);
      return debugData;
    } catch (error) {
      console.error("❌ Error debugging challenge:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  // Update the return object to include the new function
  return {
    wallet,
    program,
    createChallenge,
    participateInChallenge,
    inspectChallengeAccount,
    submitVideoOnChain,
    debugChallengeOnChain  // Add the new function
  };
}

// Define the return type for our hook
export type AnchorContextType = {
  wallet: ReturnType<typeof useAnchorWallet> | null;
  program: CoinpetitiveProgram | null;
  createChallenge: ({ reward, participationFee, votingFee, maxParticipants }: { 
    reward: number;
    participationFee: number; 
    votingFee: number;
    maxParticipants?: number;  // Add this parameter
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
  inspectChallengeAccount: (challengePublicKey: string) => Promise<ChallengeAccount | null>;
  submitVideoOnChain: (challengePublicKey: string, videoUrl: string) => Promise<{
    success: boolean;
    signature?: string;
    videoReference?: string;
    error?: string;
  }>;
  debugChallengeOnChain: (challengePublicKey: string) => Promise<{
    success: boolean;
    challengeDetails?: {
      address: string;
      creator: string;
      isActive: boolean;
      reward: string;
      participationFee: string;
      votingFee: string;
      challengeTreasury: string;
      votingTreasury: string;
      winner: string;
      totalVotes: string;
      winningVotes: string;
      rewardTokenMint: string;
      participants: {
        count: number;
        max: number;
        addresses: string[];
      };
      submissions?: {
        submissionId: string;
        votes: string;
      }[];
      votes?: {
        voter: string;
        submission: string;
      }[];
    };
    recentTransactions?: {
      signature: string;
      blockTime: string;
      err: string;
      sender: string;
    }[];
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