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

// Function to provide Anchor context values
export function useAnchorContextProvider() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  // Create the program object
  const program = useMemo(() => {
    if (!wallet || !connection) return null;

    const provider = new AnchorSDKProvider(
      connection,
      wallet,
      AnchorSDKProvider.defaultOptions()
    );

    return new Program(idl as unknown as Idl , provider);
  }, [wallet, connection]);

  // Create challenge function with defensive coding
  const createChallenge = async ({
    reward,
    participationFee,
    votingFee,
  }: {
    reward: number;
    participationFee: number;
    votingFee: number;
  }) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      // Validate inputs - ensure all parameters are valid numbers
      if (reward === undefined || participationFee === undefined || votingFee === undefined) {
        return { success: false, error: "Invalid challenge parameters - values cannot be undefined" };
      }

      // Generate a new keypair for the challenge account
      const challengeKeypair = anchor.web3.Keypair.generate();
      console.log("Generated challenge keypair:", challengeKeypair.publicKey.toString());
      
      // Get creator token account
      const creatorTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        wallet.publicKey
      );
      
      // Derive Token-2022 account address for the challenge
      const challengeTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        challengeKeypair.publicKey
      );
      
      console.log("Creator token account:", creatorTokenAccount.toString());
      console.log("Challenge token account:", challengeTokenAccount.toString());
      
      // Step 1: Create the challenge Token-2022 account first
      try {
        console.log("Creating Token-2022 account for challenge...");
        const createChallengeAtaIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,  // payer
          challengeTokenAccount,  // ata
          challengeKeypair.publicKey,  // owner (the challenge)
          CPT_TOKEN_MINT,  // mint
          TOKEN_2022_PROGRAM_ID  // Use Token-2022
        );
        
        const accountCreationTx = new Transaction().add(createChallengeAtaIx);
        
        // Fix TypeScript error with an additional check
        if (!program.provider || typeof program.provider.sendAndConfirm !== 'function') {
          console.error("Program provider not properly initialized");
          return { success: false, error: "Program provider not properly initialized" };
        }
        
        const createAccountSig = await program.provider.sendAndConfirm(accountCreationTx);
        console.log("Created challenge Token-2022 account, signature:", createAccountSig);
      } catch (e) {
        console.warn("Error creating challenge Token-2022 account:", e);
        // Continue anyway, as the error might be "account already exists"
      }

      // Convert to BN
      const rewardBN = new anchor.BN(reward || 0);
      const participationFeeBN = new anchor.BN(participationFee || 0);
      const voteFeeBN = new anchor.BN(votingFee || 0);
      
      if (!program.methods) {
        console.error("Program methods are undefined");
        return { success: false, error: "Program methods are undefined" };
      }

      // Step 2: Now create the challenge with the proper token account
      console.log("Creating challenge transaction with Token-2022 account...");
      const txObj = program.methods
        .createChallenge(
          rewardBN,
          participationFeeBN,
          voteFeeBN
        )
        .accounts({
          user: wallet.publicKey,
          challenge: challengeKeypair.publicKey,
          programAccount: PROGRAM_TREASURY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          tokenMint: CPT_TOKEN_MINT,
          creatorTokenAccount: creatorTokenAccount,
          challengeTokenAccount: challengeTokenAccount, // Use the actual Token-2022 account
        })
        .signers([challengeKeypair]);
      
      // Rest of your function (retry logic, etc.)
      let attempts = 0;
      const maxAttempts = 2;
      let tx;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Attempt ${attempts} to sign and send challenge creation transaction...`);
          
          if (attempts > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          tx = await txObj.rpc();
          console.log("Challenge creation successful! Signature:", tx);
          break;
        } catch (signError) {
          console.error(`Transaction attempt ${attempts} failed:`, signError);
          
          if (attempts >= maxAttempts) {
            throw signError;
          }
          
          console.log(`Retrying transaction (${attempts}/${maxAttempts})...`);
        }
      }

      return {
        success: true,
        challengeId: challengeKeypair.publicKey.toString(),
        signature: tx || "[Failed to get transaction signature]",
      };
    } catch (error) {
      console.error("Error creating challenge:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Update the payParticipationFee function with a more robust approach:

  const payParticipationFee = async (challengePublicKey: PublicKey) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      console.log("Challenge ID:", challengePublicKey.toString());
      
      // 1. Check if we have mint information
      console.log("Checking token mint to confirm program type...");
      const mintInfo = await connection.getAccountInfo(CPT_TOKEN_MINT);
      if (!mintInfo) {
        return { success: false, error: "Token mint not found" };
      }
      
      console.log("Mint owner:", mintInfo.owner.toString());
      const isToken2022 = mintInfo.owner.toString() === TOKEN_2022_PROGRAM_ID.toString();
      console.log("Is Token-2022 mint:", isToken2022);
      
      if (!isToken2022) {
        return { 
          success: false, 
          error: "Token mint is not owned by Token-2022 program" 
        };
      }
      
      // 2. Get both token accounts
      console.log("Getting token accounts...");
      const participantTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      const challengeTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        challengePublicKey
      );
      
      // 3. Check if accounts exist and build required instructions
      const instructions: anchor.web3.TransactionInstruction[] = [];
      
      // Check participant token account
      const participantTokenInfo = await connection.getAccountInfo(participantTokenAccount);
      if (!participantTokenInfo || participantTokenInfo.owner.toString() !== TOKEN_2022_PROGRAM_ID.toString()) {
        console.log("Will create participant Token-2022 account");
        instructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            participantTokenAccount,
            wallet.publicKey,
            CPT_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }
      
      // Check challenge token account
      const challengeTokenInfo = await connection.getAccountInfo(challengeTokenAccount);
      if (!challengeTokenInfo || challengeTokenInfo.owner.toString() !== TOKEN_2022_PROGRAM_ID.toString()) {
        console.log("Will create challenge Token-2022 account");
        instructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            challengeTokenAccount,
            challengePublicKey,
            CPT_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID
          )
        );
      }
      
      // 4. Create both accounts in a single transaction if needed
      if (instructions.length > 0) {
        console.log(`Creating ${instructions.length} token accounts...`);
        
        // Check if provider is properly initialized
        if (!program.provider || typeof program.provider.sendAndConfirm !== 'function') {
          return { success: false, error: "Program provider not properly initialized" };
        }
        
        // Send single transaction with all instructions
        const tx = new Transaction().add(...instructions);
        await program.provider.sendAndConfirm(tx);
        console.log("Created token accounts");
        
        // Brief pause to ensure accounts are available
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log("All token accounts already exist");
      }
      
      // 5. Send participation fee transaction
      console.log("Sending participation fee transaction...");
      const tx = await program.methods
        .payParticipationFee()
        .accounts({
          participant: wallet.publicKey,
          challenge: challengePublicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          participantTokenAccount: participantTokenAccount,
          challengeTokenAccount: challengeTokenAccount,
        })
        .rpc();

      console.log("Participation fee transaction successful:", tx);
      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error paying participation fee:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Submit video function - updated to include token accounts
  const submitVideo = async (challengePublicKey: PublicKey, videoUrl: string) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      // Get token accounts
      const participantTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        wallet.publicKey
      );
      const challengeTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        challengePublicKey
      );
      
      // Create a reference for the video (can be a derived PDA)
      const videoReference = PublicKey.findProgramAddressSync(
        [
          Buffer.from('video'),
          wallet.publicKey.toBuffer(),
          challengePublicKey.toBuffer(),
          Buffer.from(videoUrl.slice(0, 32)) // Use part of URL as seed
        ],
        program.programId
      )[0];

      const tx = await program.methods
        .submitVideo(videoUrl)
        .accounts({
          participant: wallet.publicKey,
          challenge: challengePublicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          participantTokenAccount: participantTokenAccount,
          challengeTokenAccount: challengeTokenAccount,
          videoReference: videoReference,
        })
        .rpc();

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error submitting video:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Vote for submission function (renamed from voteForVideo)
  const voteForSubmission = async (
    challengePublicKey: PublicKey,
    submissionId: PublicKey
  ) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      // Get token accounts
      const voterTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        wallet.publicKey
      );
      const challengeTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        challengePublicKey
      );

      const tx = await program.methods
        .voteForSubmission()
        .accounts({
          voter: wallet.publicKey,
          challenge: challengePublicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          voterTokenAccount: voterTokenAccount,
          challengeTokenAccount: challengeTokenAccount,
          submissionId: submissionId,
        })
        .rpc();

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error voting for submission:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // New function for finalizing challenge and distributing rewards
  const finalizeChallenge = async (
    challengePublicKey: PublicKey,
    winnerPublicKey: PublicKey,
    winningVotes: number
  ) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      // Get token accounts
      const winnerTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        winnerPublicKey
      );
      const creatorTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        wallet.publicKey
      );
      const challengeTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        challengePublicKey
      );
      
      // Create treasury for winning voters
      const winningVotersTreasury = PublicKey.findProgramAddressSync(
        [
          Buffer.from('winning_voters'),
          challengePublicKey.toBuffer()
        ],
        program.programId
      )[0];

      const tx = await program.methods
        .finalizeChallenge(
          winnerPublicKey,
          new anchor.BN(winningVotes)
        )
        .accounts({
          authority: wallet.publicKey,
          challenge: challengePublicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          winner: winnerPublicKey,
          winnerTokenAccount: winnerTokenAccount,
          winningVotersTreasury: winningVotersTreasury,
          creatorTokenAccount: creatorTokenAccount,
          challengeTokenAccount: challengeTokenAccount,
        })
        .rpc();

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error finalizing challenge:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  return {
    wallet,
    program,
    createChallenge,
    payParticipationFee,  // Renamed from joinChallenge
    submitVideo,
    voteForSubmission,    // Renamed from voteForVideo
    finalizeChallenge,    // New function
  };
}

// Define the return type for our hook
export type AnchorContextType = ReturnType<typeof useAnchorContextProvider>;

// Create the context
export const AnchorContext = createContext<AnchorContextType | null>(null);

// Create a hook to use the context
export const useAnchor = () => {
  const context = useContext(AnchorContext);
  if (!context) {
    throw new Error("useAnchor must be used within an AnchorProvider");
  }
  return context;
};