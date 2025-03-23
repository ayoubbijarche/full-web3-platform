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
import PocketBase from 'pocketbase';

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
      
      // Derive the main treasury PDA for participation fees
      const [treasuryPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("treasury"),
          challengeKeypair.publicKey.toBuffer()
        ],
        program.programId
      );
      
      // Derive the voting treasury PDA for voting fees
      const [votingTreasuryPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("voting_treasury"),
          challengeKeypair.publicKey.toBuffer()
        ],
        program.programId
      );
      
      // Find main treasury token account
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPDA,
        true,  // allowOwnerOffCurve set to true for PDAs
        TOKEN_2022_PROGRAM_ID  // use Token-2022 program
      );
      
      // Find voting treasury token account
      const votingTreasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        votingTreasuryPDA,
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
        votingTreasuryPDA: votingTreasuryPDA.toString(),
        votingTreasuryTokenAccount: votingTreasuryTokenAccount.toString(),
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
          votingTreasury: votingTreasuryPDA,  // Added voting treasury
          programAccount: PROGRAM_TREASURY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          tokenMint: CPT_TOKEN_MINT,
          creatorTokenAccount: userTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          votingTreasuryTokenAccount: votingTreasuryTokenAccount,  // Added voting treasury token account
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        })
        .signers([challengeKeypair])
        .rpc();
  
      console.log("Challenge created! Transaction signature:", tx);
      return {
        success: true,
        signature: tx,
        challengePublicKey: challengeKeypair.publicKey.toString(),
        treasuryPublicKey: treasuryPDA.toString(),
        votingTreasuryPublicKey: votingTreasuryPDA.toString()
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

  // Replace the voteForSubmissionOnChain function with this improved version

  const voteForSubmissionOnChain = async (challengePublicKey: string, submissionPublicKey: string) => {
    if (!wallet || !connection) {
      return { success: false, error: "Wallet not connected" };
    }
    
    if (!program) {
      return { success: false, error: "Program not initialized" };
    }
  
    try {
      // First, check if the voting treasury token account exists and create it if not
      console.log("Starting vote process for challenge:", challengePublicKey);
      
      // Convert strings to PublicKeys
      const challengePubkey = new PublicKey(challengePublicKey);
      const submissionPubkey = new PublicKey(submissionPublicKey);
      
      // Derive PDAs
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), challengePubkey.toBuffer()],
        program.programId
      );
      
      const [votingTreasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("voting_treasury"), challengePubkey.toBuffer()],
        program.programId
      );
      
      // Get token accounts
      const voterTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT, 
        wallet.publicKey
      );
      
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      
      const votingTreasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        votingTreasuryPubkey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Create a transaction to check/create the voting treasury token account if needed
      let tx = new Transaction();
      
      try {
        // Check if the voting treasury token account exists
        const votingTokenAccountInfo = await connection.getAccountInfo(votingTreasuryTokenAccount);
        
        if (!votingTokenAccountInfo) {
          console.log("Voting treasury token account doesn't exist, creating it...");
          
          // Add instruction to create the ATA
          const createAta = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            votingTreasuryTokenAccount,
            votingTreasuryPubkey,
            CPT_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID,
            TOKEN_2022_PROGRAM_ID
          );
          
          tx.add(createAta);
        }
      } catch (err) {
        console.log("Error checking token account, will attempt to create:", err);
        
        // Add instruction to create the ATA just in case
        const createAta = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          votingTreasuryTokenAccount,
          votingTreasuryPubkey,
          CPT_TOKEN_MINT,
          TOKEN_2022_PROGRAM_ID,
          TOKEN_2022_PROGRAM_ID
        );
        
        tx.add(createAta);
      }
      
      // Now add the vote instruction
      const voteIx = await program.methods
        .voteForSubmission()
        .accounts({
          voter: wallet.publicKey,
          challenge: challengePubkey,
          treasury: treasuryPubkey,
          treasuryTokenAccount: treasuryTokenAccount,
          votingTreasury: votingTreasuryPubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          voterTokenAccount: voterTokenAccount,
          votingTreasuryTokenAccount: votingTreasuryTokenAccount,
          submissionId: submissionPubkey,
          // Add any missing accounts your program expects 
          systemProgram: SystemProgram.programId,  // May be needed for creating accounts
        })
        .instruction();
      
      tx.add(voteIx);
      
      // Set recent blockhash and fee payer
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = wallet.publicKey;
      
      // Sign and send the transaction
      console.log("Sending vote transaction...");
      const signedTx = await wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Wait for confirmation
      console.log("Waiting for transaction confirmation...");
      await connection.confirmTransaction(signature);
      
      console.log("Vote successful! Transaction ID:", signature);
      return {
        success: true,
        signature
      };
    } catch (error) {
      console.error("Error voting for submission:", error);
      
      let errorMessage = "Failed to vote for submission";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes("AlreadyVoted")) {
          errorMessage = "You have already voted for this submission";
        } else if (errorMessage.includes("ChallengeNotActive")) {
          errorMessage = "This challenge is no longer active";
        } else if (errorMessage.includes("AccountDidNotSerialize")) {
          errorMessage = "Error updating challenge data. The voters list might be full.";
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

  // Add this function to check the voting treasury balance

  const getVotingTreasuryBalance = async (challengePublicKey: string) => {
    if (!connection) {
      return {
        success: false,
        error: "Connection not available"
      };
    }
  
    try {
      // Convert string to PublicKey
      const challengePubkey = new PublicKey(challengePublicKey);
      
      // Derive the voting treasury PDA from the challenge
      const [votingTreasuryPubkey] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("voting_treasury"),
          challengePubkey.toBuffer()
        ],
        PROGRAM_ID
      );
      
      // Find voting treasury token account
      const votingTreasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        votingTreasuryPubkey,
        true, // allowOwnerOffCurve for PDAs
        TOKEN_2022_PROGRAM_ID
      );
      
      console.log("Voting Treasury information:", {
        challenge: challengePubkey.toString(),
        votingTreasury: votingTreasuryPubkey.toString(),
        votingTreasuryTokenAccount: votingTreasuryTokenAccount.toString()
      });
      
      // Get the token account info
      const tokenAccountInfo = await connection.getTokenAccountBalance(votingTreasuryTokenAccount);
      
      // Get the SOL balance of the voting treasury
      const solBalance = await connection.getBalance(votingTreasuryPubkey);
      
      return {
        success: true,
        tokenBalance: tokenAccountInfo.value.uiAmount ?? undefined,
        tokenDecimals: tokenAccountInfo.value.decimals,
        tokenAmountRaw: tokenAccountInfo.value.amount,
        solBalance: solBalance / LAMPORTS_PER_SOL,
        votingTreasuryAddress: votingTreasuryPubkey.toString(),
        votingTreasuryTokenAccount: votingTreasuryTokenAccount.toString()
      };
    } catch (error: unknown) {
      console.error("Error fetching voting treasury balance:", error);
      
      let errorMessage = "Failed to get voting treasury balance";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes("account not found")) {
          errorMessage = "Voting treasury token account not found. The account might not have been created yet.";
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  const finalizeChallenge = async (challengePublicKey: string) => {
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
      
      console.log("Starting challenge finalization for:", challengePublicKey);
      
      // Step 1: Fetch all video submissions for this challenge from PocketBase
      const pb = new PocketBase('http://127.0.0.1:8090');
      
      // Get the PocketBase challenge ID from onchain_id
      let pbChallengeId = "";
      try {
        const pbChallenges = await pb.collection('challenges').getList(1, 1, {
          filter: `onchain_id = "${challengePublicKey}"`
        });
        
        if (pbChallenges.items.length === 0) {
          return {
            success: false,
            error: "Challenge not found in PocketBase"
          };
        }
        
        pbChallengeId = pbChallenges.items[0].id;
        console.log("Found PocketBase challenge ID:", pbChallengeId);
      } catch (pbError) {
        console.error("Error fetching challenge from PocketBase:", pbError);
        return {
          success: false,
          error: "Failed to fetch challenge from PocketBase"
        };
      }
      
      // Get all video submissions for this challenge
      let submissions: any = null;
      try {
        // Make sure to sort by vote_count descending to get the winner
        submissions = await pb.collection('video_submitted').getList(1, 100, {
          filter: `challenge = "${pbChallengeId}"`,
          sort: "-vote_count",
          expand: "participant"
        });
        
        console.log("Found video submissions:", submissions.items.length);
      } catch (submissionsError) {
        console.error("Error fetching submissions from PocketBase:", submissionsError);
        return {
          success: false,
          error: "Failed to fetch video submissions from PocketBase"
        };
      }
      
      if (submissions.items.length === 0) {
        return {
          success: false,
          error: "No video submissions found for this challenge"
        };
      }
      
      // Step 2: Determine the winner (submission with highest vote_count)
      const winnerSubmission = submissions.items[0]; // Already sorted by vote_count desc
      
      console.log("Winner submission:", {
        id: winnerSubmission.id,
        vote_count: winnerSubmission.vote_count,
        participant: winnerSubmission.expand?.participant?.id,
        pubkey: winnerSubmission.expand?.participant?.pubkey
      });
      
      // Step 3: Get the winner's pubkey
      let winnerPubkey;
      try {
        if (winnerSubmission.expand?.participant?.pubkey) {
          // If expanded participant has pubkey
          winnerPubkey = new PublicKey(winnerSubmission.expand.participant.pubkey);
        } else if (winnerSubmission.participant) {
          // If not expanded, fetch participant directly
          // Handle array or single value
          const participantId = Array.isArray(winnerSubmission.participant) 
            ? winnerSubmission.participant[0] 
            : winnerSubmission.participant;
            
          console.log("Fetching participant details:", participantId);
            
          const participant = await pb.collection('users').getOne(participantId);
          if (!participant.pubkey) {
            return {
              success: false,
              error: "Winner's wallet address not found"
            };
          }
          winnerPubkey = new PublicKey(participant.pubkey);
        } else {
          return {
            success: false,
            error: "Winner's participant reference not found"
          };
        }
        
        console.log("Winner pubkey:", winnerPubkey.toString());
      } catch (pubkeyError) {
        console.error("Error getting winner's pubkey:", pubkeyError);
        return {
          success: false,
          error: "Failed to get winner's wallet address"
        };
      }
      
      // Step 4: Derive the treasury PDA
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), challengePubkey.toBuffer()],
        program.programId
      );
      
      // Step 5: Find treasury token account
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Step 6: Find or create winner's token account
      const winnerTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        winnerPubkey
      );
      
      // Check if winner token account exists
      const winnerTokenAccountInfo = await connection.getAccountInfo(winnerTokenAccount);
      if (!winnerTokenAccountInfo) {
        console.log("Creating token account for winner:", winnerPubkey.toString());
        
        // Create the associated token account instruction
        const createAtaIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          winnerTokenAccount, 
          winnerPubkey,
          CPT_TOKEN_MINT,
          TOKEN_2022_PROGRAM_ID
        );
        
        const tx = new Transaction().add(createAtaIx);
        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signedTx = await wallet.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction(signature);
        
        console.log("Created winner token account:", signature);
      }

      // Add this right after creating the winner's token account

      // Step 6b: Get or create creator's token account (creator is the wallet owner in this case)
      const creatorTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      // Check if creator token account exists
      const creatorTokenAccountInfo = await connection.getAccountInfo(creatorTokenAccount);
      if (!creatorTokenAccountInfo) {
        console.log("Creating token account for creator:", wallet.publicKey.toString());
        
        // Create the associated token account instruction
        const createCreatorAtaIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey, // payer
          creatorTokenAccount, 
          wallet.publicKey, // owner is the creator
          CPT_TOKEN_MINT,
          TOKEN_2022_PROGRAM_ID
        );
        
        const tx = new Transaction().add(createCreatorAtaIx);
        tx.feePayer = wallet.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const signedTx = await wallet.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signedTx.serialize());
        await connection.confirmTransaction(signature);
        
        console.log("Created creator token account:", signature);
      }
      
      // Step 7: Call the finalize_challenge instruction with all accounts
      console.log("Finalizing challenge with accounts:", {
        challenge: challengePubkey.toString(),
        treasury: treasuryPubkey.toString(),
        treasuryToken: treasuryTokenAccount.toString(),
        winner: winnerPubkey.toString(),
        winnerToken: winnerTokenAccount.toString(),
        creator: wallet.publicKey.toString(),
        creatorToken: creatorTokenAccount.toString(),
        voteCount: winnerSubmission.vote_count || 1
      });
      
      const tx = await program.methods
        .finalizeChallenge(
          winnerPubkey, 
          new anchor.BN(winnerSubmission.vote_count || 1)
        )
        .accounts({
          authority: wallet.publicKey,
          challenge: challengePubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          winnerTokenAccount: winnerTokenAccount,
          treasury: treasuryPubkey,
          treasuryTokenAccount: treasuryTokenAccount,
          creatorTokenAccount: creatorTokenAccount, // Add this line
        })
        .rpc();
      
      console.log("Successfully finalized challenge! Transaction signature:", tx);
      
      // Step 8: Update challenge in PocketBase to mark as finalized
      try {
        await pb.collection('challenges').update(pbChallengeId, {
          state: "completed" // Changed from 'finalized' to match your schema states
        });
      } catch (updateError) {
        console.log("Warning: Could not update challenge state in PocketBase", updateError);
        // Continue since the on-chain finalization succeeded
      }
      
      return {
        success: true,
        signature: tx,
        winner: winnerPubkey.toString(),
        winningVotes: winnerSubmission.vote_count || 1
      };
    } catch (error) {
      console.error("Error in finalizeChallenge:", error);
      
      let errorMessage = "Failed to finalize challenge";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Add this new function in your useAnchorContextProvider function

  const finalizeVotingTreasury = async (challengePublicKey: string) => {
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
      
      console.log("Starting voting treasury distribution for:", challengePublicKey);
      
      // Fetch challenge data from PocketBase
      const pb = new PocketBase('http://127.0.0.1:8090');
      
      // Get the PocketBase challenge ID from onchain_id
      let pbChallengeId = "";
      try {
        const pbChallenges = await pb.collection('challenges').getList(1, 1, {
          filter: `onchain_id = "${challengePublicKey}"`
        });
        
        if (pbChallenges.items.length === 0) {
          return {
            success: false,
            error: "Challenge not found in PocketBase"
          };
        }
        
        pbChallengeId = pbChallenges.items[0].id;
        console.log("Found PocketBase challenge ID:", pbChallengeId);
      } catch (pbError) {
        console.error("Error fetching challenge from PocketBase:", pbError);
        return {
          success: false,
          error: "Failed to fetch challenge from PocketBase"
        };
      }
      
      // Get winning submission (highest vote count)
      let winnerSubmission;
      try {
        const submissions = await pb.collection('video_submitted').getList(1, 100, {
          filter: `challenge = "${pbChallengeId}"`,
          sort: "-vote_count",
          expand: "participant"
        });
        
        if (submissions.items.length === 0) {
          return {
            success: false,
            error: "No submissions found for this challenge"
          };
        }
        
        winnerSubmission = submissions.items[0];
        console.log("Winner submission:", winnerSubmission.id, "with", winnerSubmission.vote_count, "votes");
      } catch (submissionsError) {
        console.error("Error fetching submissions:", submissionsError);
        return {
          success: false,
          error: "Failed to fetch submissions"
        };
      }
      
      // Get voting treasury PDA
      const [votingTreasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("voting_treasury"), challengePubkey.toBuffer()],
        program.programId
      );
      
      // Get voting treasury token account
      const votingTreasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        votingTreasuryPubkey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Get the winning submission with voters expanded
      const winnerSubmissionWithVoters = await pb.collection('video_submitted').getOne(
        winnerSubmission.id, 
        { expand: 'voters' }
      );
      
      // Check if there are voters
      if (!winnerSubmissionWithVoters.voters || winnerSubmissionWithVoters.voters.length === 0) {
        return {
          success: false,
          error: "No voters found for winning submission"
        };
      }
      
      console.log(`Found ${winnerSubmissionWithVoters.voters.length} voters for winning submission`);
      
      // Get all the voter IDs
      const voterIds = Array.isArray(winnerSubmissionWithVoters.voters) 
        ? winnerSubmissionWithVoters.voters 
        : [winnerSubmissionWithVoters.voters];
      
      // Fetch all voters from users collection to get their pubkeys
      const voters = await Promise.all(
        voterIds.map(async (voterId) => {
          try {
            return await pb.collection('users').getOne(voterId);
          } catch (err) {
            console.warn(`Could not fetch voter with ID ${voterId}`, err);
            return null;
          }
        })
      );
      
      // Filter out any null results and users without pubkeys
      const validVoters = voters.filter(voter => voter && voter.pubkey);
      
      if (validVoters.length === 0) {
        return {
          success: false,
          error: "No voters with valid wallet addresses found"
        };
      }
      
      console.log(`Found ${validVoters.length} voters with valid wallet addresses`);
      
      let voterResults = [];
      let processedCount = 0;
      
      // Process each voter with a public key
      for (let i = 0; i < validVoters.length; i++) {
        const voter = validVoters[i];
        const voterPubkey = new PublicKey(voter.pubkey);
        
        console.log(`Processing voter ${i+1}/${validVoters.length}: ${voter.username} (${voterPubkey.toString().substring(0, 8)}...)`);
        
        // Create voter token account if it doesn't exist
        const voterTokenAccount = getAssociatedToken2022AddressSync(
          CPT_TOKEN_MINT,
          voterPubkey
        );
        
        const voterAccountInfo = await connection.getAccountInfo(voterTokenAccount);
        if (!voterAccountInfo) {
          console.log(`Creating token account for voter ${i+1}`);
          
          const createAtaIx = createAssociatedTokenAccountInstruction(
            wallet.publicKey, // payer
            voterTokenAccount,
            voterPubkey,
            CPT_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID
          );
          
          const createTx = new Transaction().add(createAtaIx);
          createTx.feePayer = wallet.publicKey;
          createTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signedTx = await wallet.signTransaction(createTx);
          const signature = await connection.sendRawTransaction(signedTx.serialize());
          await connection.confirmTransaction(signature);
          
          console.log(`Created token account for voter ${i+1}, signature: ${signature}`);
        }
        
        // Call the distributeVotingTreasury instruction
        try {
          const distributeTx = await program.methods
            .distributeVotingTreasury(
              voterPubkey,
              new anchor.BN(i) // voter index
            )
            .accounts({
              authority: wallet.publicKey,
              challenge: challengePubkey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
              votingTreasury: votingTreasuryPubkey,
              votingTreasuryTokenAccount: votingTreasuryTokenAccount,
              voterTokenAccount: voterTokenAccount,
            })
            .rpc();
          
          console.log(`Successfully distributed voting treasury to voter ${i+1}, signature: ${distributeTx}`);
          voterResults.push({
            voter: voterPubkey.toString(),
            success: true,
            signature: distributeTx
          });
          processedCount++;
        } catch (distError) {
          console.error(`Error distributing to voter ${i+1}:`, distError);
          voterResults.push({
            voter: voterPubkey.toString(),
            success: false,
            error: distError instanceof Error ? distError.message : "Unknown error"
          });
        }
        
        // Add a small delay between transactions to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      return {
        success: true,
        processed: processedCount,
        total: validVoters.length,
        results: voterResults
      };
    } catch (error) {
      console.error("Error in finalizeVotingTreasury:", error);
      
      let errorMessage = "Failed to finalize voting treasury";
      if (error instanceof Error) {
        errorMessage = error.message;
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
    voteForSubmissionOnChain,
    getTreasuryBalance,
    getVotingTreasuryBalance,
    finalizeChallenge,
    finalizeVotingTreasury // Add this line
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
  getVotingTreasuryBalance: (challengePublicKey: string) => Promise<{
    success: boolean;
    tokenBalance?: number;
    tokenDecimals?: number;
    tokenAmountRaw?: string;
    solBalance?: number;
    votingTreasuryAddress?: string;
    votingTreasuryTokenAccount?: string;
    error?: string;
  }>;
  finalizeChallenge: (challengePublicKey: string) => Promise<{
    success: boolean;
    signature?: string;
    winner?: string;
    winningVotes?: number;
    error?: string;
  }>;
  finalizeVotingTreasury: (challengePublicKey: string) => Promise<{
    success: boolean;
    processed?: number;
    total?: number;
    results?: any[];
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