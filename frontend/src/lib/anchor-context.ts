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
  is_active: boolean;  // Changed from isActive
  reward: anchor.BN;
  participation_fee: anchor.BN;  // Changed from participationFee
  voting_fee: anchor.BN;  // Changed from votingFee
  challenge_treasury: anchor.BN;  // Changed from challengeTreasury
  voting_treasury: anchor.BN;  // Changed from votingTreasury
  winner: PublicKey | null;
  total_votes: anchor.BN;  // Changed from totalVotes
  winning_votes: anchor.BN;  // Changed from winningVotes
  reward_token_mint: PublicKey;  // Changed from rewardTokenMint
  participants: PublicKey[];
  max_participants: number;  // Changed from maxParticipants
  submission_votes: [PublicKey, anchor.BN][]; // Changed from submissionVotes
  voters: [PublicKey, PublicKey][]; 
  [key: string]: any; // Index signature allowing access with string keys
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
      
      // Generate a unique challenge ID using timestamp
      const challengeId = new anchor.BN(Date.now());
      
      // Derive the treasury PDA
      const [treasuryPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("treasury"),
          challengeKeypair.publicKey.toBuffer()
        ],
        program.programId
      );
      
      // Find treasury token account
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPDA,
        true,  // allowOwnerOffCurve set to true for PDAs
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
        treasuryPDA: treasuryPDA.toString(),
        treasuryTokenAccount: treasuryTokenAccount.toString(),
      });
  
      // Create the challenge
      const tx = await program.methods
        .createChallenge(
          new anchor.BN(reward),
          new anchor.BN(participationFee),
          new anchor.BN(votingFee),
          maxParticipants,
          challengeId  // Pass the challenge ID
        )
        .accounts({
          user: wallet.publicKey,
          challenge: challengeKeypair.publicKey,
          treasury: treasuryPDA,
          programAccount: PROGRAM_TREASURY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          tokenMint: CPT_TOKEN_MINT,
          creatorTokenAccount: userTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        })
        .signers([challengeKeypair])
        .rpc();
  
      console.log("Challenge created! Transaction signature:", tx);
      return {
        success: true,
        signature: tx,
        challengePublicKey: challengeKeypair.publicKey.toString(),
        treasuryPublicKey: treasuryPDA.toString()
      };
    } catch (error: unknown) {
      console.error("Error creating challenge:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
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
      console.log("Program object:", program);
      console.log("Program accounts:", program.account);
      
      // Convert string to PublicKey
      const challengePubkey = new PublicKey(challengePublicKey);
      
      // Safety check before fetching
      if (!program.account || !program.account.challenge || typeof program.account.challenge.fetch !== 'function') {
        console.error("Program account structure is invalid:", program.account);
        
        // We'll continue without fetching the challenge account
        // and directly derive the treasury address based on the challenge public key
        
        // Derive the treasury PDA directly without fetching the challenge
        const [treasuryPubkey] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("treasury"),
            challengePubkey.toBuffer()
          ],
          program.programId
        );
        
        // Find the token accounts
        const participantTokenAccount = getAssociatedToken2022AddressSync(
          CPT_TOKEN_MINT,
          wallet.publicKey
        );
        
        const treasuryTokenAccount = getAssociatedTokenAddressSync(
          CPT_TOKEN_MINT,
          treasuryPubkey,
          true, // allowOwnerOffCurve for PDA
          TOKEN_2022_PROGRAM_ID
        );
        
        console.log("Participating in challenge:", challengePublicKey);
        console.log("Treasury (derived):", treasuryPubkey.toString());
        console.log("Treasury token account:", treasuryTokenAccount.toString());
        console.log("Participant token account:", participantTokenAccount.toString());
        
        // Call the payParticipationFee instruction
        const tx = await program.methods
          .payParticipationFee()
          .accounts({
            participant: wallet.publicKey,
            challenge: challengePubkey,
            treasury: treasuryPubkey,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            participantTokenAccount: participantTokenAccount,
            treasuryTokenAccount: treasuryTokenAccount,
            systemProgram: SystemProgram.programId
          })
          .rpc();
        
        console.log("Successfully participated in challenge! Transaction signature:", tx);
        return {
          success: true,
          signature: tx
        };
      }
      
      // If we reach here, we can try to fetch the challenge account
      const challenge = await program.account.challenge.fetch(challengePubkey);
      const treasuryPubkey = challenge.treasury;
      
      // Find the token accounts
      const participantTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true, // allowOwnerOffCurve for PDA
        TOKEN_2022_PROGRAM_ID
      );
      
      // Rest of the function remains the same...
      console.log("Participating in challenge:", challengePublicKey);
      console.log("Treasury:", treasuryPubkey.toString());
      console.log("Treasury token account:", treasuryTokenAccount.toString());
      console.log("Participant token account:", participantTokenAccount.toString());
      
      // Call the payParticipationFee instruction
      const tx = await program.methods
        .payParticipationFee()
        .accounts({
          participant: wallet.publicKey,
          challenge: challengePubkey,
          treasury: treasuryPubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          participantTokenAccount: participantTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
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
        } else if (errorMessage.includes("AlreadyParticipated")) {
          errorMessage = "You are already participating in this challenge.";
        } else if (errorMessage.includes("fetch")) {
          errorMessage = "Unable to retrieve challenge data. Please try again.";
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
        participationFee: challengeAccount.participation_fee.toString(),
        votingFee: challengeAccount.voting_fee.toString(),
        isActive: challengeAccount.is_active,
        maxParticipants: challengeAccount.max_participants,
        participants: challengeAccount.participants?.map(p => p.toString()),
        participantsCount: challengeAccount.participants?.length || 0
      });
      
      return challengeAccount;
    } catch (error) {
      console.error("Error inspecting challenge:", error);
      return null;
    }
  };

  // Update the submitVideoOnChain function:

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
      // Convert string to PublicKey
      const challengePubkey = new PublicKey(challengePublicKey);
      console.log("Submitting to challenge public key:", challengePubkey.toString());
      
      // Derive the treasury PDA directly without fetching the challenge
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("treasury"),
          challengePubkey.toBuffer()
        ],
        program.programId
      );
      
      // Find token accounts
      const participantTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true, // allowOwnerOffCurve for PDAs
        TOKEN_2022_PROGRAM_ID
      );
      
      // Create a reference for this video submission
      const videoReference = anchor.web3.Keypair.generate().publicKey;
      
      console.log("Submitting video with:", {
        challenge: challengePubkey.toString(),
        treasury: treasuryPubkey.toString(),
        treasuryTokenAccount: treasuryTokenAccount.toString(),
        participantTokenAccount: participantTokenAccount.toString(),
        videoReference: videoReference.toString()
      });
      
      // Call the submit_video instruction directly
      const tx = await program.methods
        .submitVideo(videoUrl)
        .accounts({
          participant: wallet.publicKey,
          challenge: challengePubkey,
          treasury: treasuryPubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          participantTokenAccount: participantTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          videoReference: videoReference,
        })
        .rpc();
      
      console.log("Successfully submitted video! Transaction signature:", tx);
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

  // Update your voteForSubmissionOnChain function

  const voteForSubmissionOnChain = async (challengePublicKey: string, submissionPublicKey: string) => {
    console.log("🔍 voteForSubmissionOnChain called with:", {
      challengePublicKey,
      submissionPublicKey
    });
    
    if (!wallet) {
      console.log("🔍 Wallet not connected");
      return {
        success: false,
        error: "Wallet not connected"
      };
    }
    
    if (!program) {
      console.log("🔍 Program not initialized");
      return {
        success: false,
        error: "Program not initialized"
      };
    }
  
    try {
      // Convert strings to PublicKeys
      const challengePubkey = new PublicKey(challengePublicKey);
      const submissionPubkey = new PublicKey(submissionPublicKey);
      console.log("🔍 Converting to PublicKeys successful:", {
        challenge: challengePubkey.toString(),
        submission: submissionPubkey.toString()
      });
      
      // Derive the treasury PDA from the challenge
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("treasury"),
          challengePubkey.toBuffer()
        ],
        program.programId
      );
      
      // Find token accounts
      const voterTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true, // allowOwnerOffCurve for PDAs
        TOKEN_2022_PROGRAM_ID
      );
      
      console.log("🔍 Token accounts:", {
        voter: voterTokenAccount.toString(),
        treasury: treasuryPubkey.toString(),
        treasuryToken: treasuryTokenAccount.toString()
      });
      
      // Log program methods to verify it's correctly loaded
      console.log("🔍 Program methods available:", {
        voteMethod: !!program.methods.voteForSubmission,
        programId: program.programId.toString()
      });
      
      // Call the vote_for_submission instruction
      console.log("🔍 About to call program.methods.voteForSubmission()");
      const tx = await program.methods
        .voteForSubmission()
        .accounts({
          voter: wallet.publicKey,
          challenge: challengePubkey,
          treasury: treasuryPubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          voterTokenAccount: voterTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          submissionId: submissionPubkey,
        })
        .rpc();
      
      console.log("🔍 Successfully voted for submission! Transaction signature:", tx);
      return {
        success: true,
        signature: tx
      };
    } catch (error: unknown) {
      console.error("🔍 Detailed error voting for submission:", error);
      
      // Extract specific error messages
      let errorMessage = "Failed to vote for submission";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.log("🔍 Error message:", errorMessage);
        
        if (errorMessage.includes("AlreadyVoted")) {
          errorMessage = "You have already voted for this submission";
        } else if (errorMessage.includes("ChallengeNotActive")) {
          errorMessage = "This challenge is no longer active";
        } else if (errorMessage.includes("InvalidTreasury")) {
          errorMessage = "Invalid treasury account for this challenge";
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Add this function to your useAnchorContextProvider function

  const getTreasuryBalance = async (challengePublicKey: string) => {
    if (!connection) {
      return {
        success: false,
        error: "Connection not available"
      };
    }
  
    try {
      // Convert string to PublicKey
      const challengePubkey = new PublicKey(challengePublicKey);
      
      // Derive the treasury PDA from the challenge
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("treasury"),
          challengePubkey.toBuffer()
        ],
        PROGRAM_ID
      );
      
      // Find treasury token account
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true, // allowOwnerOffCurve for PDAs
        TOKEN_2022_PROGRAM_ID
      );
      
      console.log("Treasury information:", {
        challenge: challengePubkey.toString(),
        treasury: treasuryPubkey.toString(),
        treasuryTokenAccount: treasuryTokenAccount.toString()
      });
      
      // Get the token account info
      const tokenAccountInfo = await connection.getTokenAccountBalance(treasuryTokenAccount);
      
      // Get the SOL balance of the treasury
      const solBalance = await connection.getBalance(treasuryPubkey);
      
      return {
        success: true,
        tokenBalance: tokenAccountInfo.value.uiAmount ?? undefined, // Convert null to undefined
        tokenDecimals: tokenAccountInfo.value.decimals,
        tokenAmountRaw: tokenAccountInfo.value.amount,
        solBalance: solBalance / LAMPORTS_PER_SOL,
        treasuryAddress: treasuryPubkey.toString(),
        treasuryTokenAccount: treasuryTokenAccount.toString()
      };
    } catch (error: unknown) {
      console.error("Error fetching treasury balance:", error);
      
      // Try to provide more specific error information
      let errorMessage = "Failed to get treasury balance";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for common token account errors
        if (errorMessage.includes("account not found")) {
          errorMessage = "Treasury token account not found. The account might not have been created yet.";
        }
      }
      
      return {
        success: false,
        error: errorMessage
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
    voteForSubmissionOnChain,  // Add this line
    getTreasuryBalance  // Add this line
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
    maxParticipants?: number;
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
  voteForSubmissionOnChain: (challengePublicKey: string, submissionPublicKey: string) => Promise<{
    success: boolean;
    signature?: string;
    error?: string;
  }>;
  getTreasuryBalance: (challengePublicKey: string) => Promise<{
    success: boolean;
    tokenBalance?: number;
    tokenDecimals?: number;
    tokenAmountRaw?: string;
    solBalance?: number;
    treasuryAddress?: string;
    treasuryTokenAccount?: string;
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