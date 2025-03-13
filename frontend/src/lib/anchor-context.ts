'use client';

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider as AnchorSDKProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { createContext, useContext, useMemo } from "react";
import idl from "./idl.json";


export const PROGRAM_ID = new PublicKey("7RUA3ry7n4ELZpMA4TwQBMmiHTKEhwSqML5xywM4m2pr");


export const PROGRAM_TREASURY = new PublicKey("FuFzoMF5xTwZego84fRoscnart4dPYNkpHho2UBe7NDt");

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

  // Create challenge function
  const createChallenge = async ({
    reward,
    registrationFee,
    submissionFee,
    votingFee,
  }: {
    reward: number;
    registrationFee: number;
    submissionFee: number;
    votingFee: number;
  }) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      // Generate a new keypair for the challenge account
      const challengeKeypair = anchor.web3.Keypair.generate();

      // Log with smaller values to verify parameters
      console.log("Creating challenge with parameters:", {
        reward: reward.toString(),
        registrationFee: registrationFee.toString(),
        submissionFee: submissionFee.toString(),
        votingFee: votingFee.toString(),
        wallet: wallet.publicKey.toString(),
        challenge: challengeKeypair.publicKey.toString(),
      });

      // Convert to BN with proper scaling - avoid extremely large numbers
      const rewardBN = new anchor.BN(Math.min(reward, 1000 * LAMPORTS_PER_SOL));
      const regFeeBN = new anchor.BN(Math.min(registrationFee, 100 * LAMPORTS_PER_SOL));
      const subFeeBN = new anchor.BN(Math.min(submissionFee, 100 * LAMPORTS_PER_SOL));
      const voteFeeBN = new anchor.BN(Math.min(votingFee, 100 * LAMPORTS_PER_SOL));
      
      // Debug: log all available methods to see what's actually available
      console.log("Program methods:", Object.keys(program.methods));
      
      // In Anchor, IDL names in snake_case are transformed to camelCase in JS
      // So `create_challenge` in IDL is accessed as `createChallenge` in JS
      const tx = await program.methods
        .createChallenge(
          rewardBN,
          regFeeBN,
          subFeeBN,
          voteFeeBN
        )
        .accounts({
          user: wallet.publicKey,
          challenge: challengeKeypair.publicKey,
          programAccount: PROGRAM_TREASURY,
          systemProgram: SystemProgram.programId,
        })
        .signers([challengeKeypair])
        .rpc();

      console.log("Challenge created successfully with signature:", tx);

      return {
        success: true,
        challengeId: challengeKeypair.publicKey.toString(),
        signature: tx,
      };
    } catch (error) {
      console.error("Error creating challenge:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Join challenge function
  const joinChallenge = async (challengePublicKey: PublicKey) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      const tx = await program.methods
        .joinChallenge()
        .accounts({
          user: wallet.publicKey,
          challenge: challengePublicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error joining challenge:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  // Submit video function
  const submitVideo = async (challengePublicKey: PublicKey, videoUrl: string) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      const tx = await program.methods
        .submitVideo(videoUrl)
        .accounts({
          participant: wallet.publicKey,
          challenge: challengePublicKey,
          systemProgram: SystemProgram.programId,
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

  // Vote for video function
  const voteForVideo = async (
    challengePublicKey: PublicKey,
    creatorPublicKey: PublicKey,
    submissionIndex: number
  ) => {
    if (!program || !wallet) return { success: false, error: "Wallet or program not initialized" };

    try {
      const tx = await program.methods
        .voteForVideo(new anchor.BN(submissionIndex))
        .accounts({
          voter: wallet.publicKey,
          creator: creatorPublicKey,
          challenge: challengePublicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return { success: true, signature: tx };
    } catch (error) {
      console.error("Error voting for video:", error);
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
    joinChallenge,
    submitVideo,
    voteForVideo,
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