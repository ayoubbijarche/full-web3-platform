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

export const PROGRAM_ID = new PublicKey("H7SvZyDYbZ7ioeCTYWE4wuVdgWUyA5XJ1CAZnsH7ga8E");
export const PROGRAM_TREASURY = new PublicKey("FuFzoMF5xTwZego84fRoscnart4dPYNkpHho2UBe7NDt");
export const CPT_TOKEN_MINT = new PublicKey("wc3eLDaYLrPwD6Xacvb4xfXD1Cu6Mcw7ZbWopNynNYT");
export const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"); // Regular Token program

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
    if (!program || !wallet || !connection) {
      throw new Error("Wallet not connected");
    }
  
    try {
      // Divide by 100 to compensate for the 2-decimal mismatch
      const adjustedReward = reward / 100; 
      const adjustedParticipationFee = participationFee / 100;
      const adjustedVotingFee = votingFee / 100;
      
      console.log("Creating challenge with adjusted amounts:", {
        originalReward: reward,
        adjustedReward: adjustedReward,
        originalParticipationFee: participationFee,
        adjustedParticipationFee: adjustedParticipationFee,
        originalVotingFee: votingFee,
        adjustedVotingFee: adjustedVotingFee,
      });
      
      // Generate a new keypair for the challenge account
      const challengeKeypair = anchor.web3.Keypair.generate();
      
      // Generate a unique challenge ID using timestamp
      const challengeId = new anchor.BN(Date.now());
      
      // Derive PDAs and find token accounts - no changes to this part
      const [treasuryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), challengeKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      const [votingTreasuryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("voting_treasury"), challengeKeypair.publicKey.toBuffer()],
        program.programId
      );
      
      // Find token accounts - no changes
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPDA,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      
      const votingTreasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        votingTreasuryPDA,
        true,
        TOKEN_2022_PROGRAM_ID
      );
  
      const userTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
  
      console.log("Creating challenge with parameters:", {
        reward: adjustedReward.toString(),
        participationFee: adjustedParticipationFee.toString(),
        votingFee: adjustedVotingFee.toString(),
        challengePubkey: challengeKeypair.publicKey.toString(),
        treasuryPDA: treasuryPDA.toString(),
        treasuryTokenAccount: treasuryTokenAccount.toString()
      });
  
      // Get the latest blockhash for better transaction confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
      // BUILD TRANSACTION MANUALLY FOR MORE CONTROL
      const createChallengeIx = await program.methods
        .createChallenge(
          new anchor.BN(adjustedReward),
          new anchor.BN(adjustedParticipationFee),
          new anchor.BN(adjustedVotingFee),
          maxParticipants,
          challengeId
        )
        .accounts({
          user: wallet.publicKey,
          challenge: challengeKeypair.publicKey,
          treasury: treasuryPDA,
          votingTreasury: votingTreasuryPDA,
          programAccount: PROGRAM_TREASURY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          tokenMint: CPT_TOKEN_MINT,
          creatorTokenAccount: userTokenAccount,
          treasuryTokenAccount: treasuryTokenAccount,
          votingTreasuryTokenAccount: votingTreasuryTokenAccount,
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
        })
        .instruction();
  
      // Create transaction with the instruction
      const tx = new Transaction().add(createChallengeIx);
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = blockhash;
      
      // Add the challenge keypair as signer
      tx.partialSign(challengeKeypair);
  
      // Sign with wallet
      const signedTx = await wallet.signTransaction(tx);
      
      // Send the transaction with skipPreflight set to false for better validation
      console.log("Sending challenge creation transaction...");
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      console.log("Challenge creation transaction sent:", signature);
  
      try {
        // Use enhanced confirmation with timeout parameters
        console.log("Waiting for confirmation...");
        const status = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (status.value.err) {
          console.error("Transaction confirmed but failed:", status.value.err);
          return {
            success: false,
            error: `Transaction failed: ${JSON.stringify(status.value.err)}`
          };
        }
        
        console.log("Challenge created successfully! Transaction signature:", signature);
        return {
          success: true,
          signature,
          challengePublicKey: challengeKeypair.publicKey.toString(),
          treasuryPublicKey: treasuryPDA.toString(),
          votingTreasuryPublicKey: votingTreasuryPDA.toString()
        };
      } catch (confirmError) {
        // Special handling for confirmation timeout
        if (confirmError instanceof Error && confirmError.message.includes("was not confirmed")) {
          console.warn("Transaction confirmation timed out but may still succeed");
          return {
            success: false,
            error: "Transaction submitted but confirmation timed out. Check the transaction status manually.",
            pendingSignature: signature,
            challengePublicKey: challengeKeypair.publicKey.toString(),
            treasuryPublicKey: treasuryPDA.toString(),
            votingTreasuryPublicKey: votingTreasuryPDA.toString()
          };
        }
        
        throw confirmError; // Re-throw other confirmation errors
      }
    } catch (error) {
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
      
      // Get the latest blockhash for transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
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
        .rpc({ skipPreflight: false }); // Enable preflight checks
      
      console.log("Transaction submitted! Waiting for confirmation...");
      
      // Use a more robust confirmation strategy with longer timeout
      const status = await connection.confirmTransaction({
        signature: tx,
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight
      }, 'confirmed');
      
      if (status.value.err) {
        console.error("Transaction confirmed but failed:", status.value.err);
        return {
          success: false,
          error: `Transaction failed: ${JSON.stringify(status.value.err)}`
        };
      }
      
      console.log("Successfully submitted video! Transaction signature:", tx);
      return {
        success: true,
        signature: tx,
        videoReference: videoReference.toString()
      };
    } catch (error: unknown) {
      console.error("Error submitting video on-chain:", error);
      
      // Check if it's a timeout error but the transaction might still be processing
      if (error instanceof Error && error.message.includes("was not confirmed")) {
        return {
          success: false,
          error: "Transaction submitted but confirmation timed out. Check the transaction status manually.",
          pendingSignature: error.message.match(/Check signature ([^\s]+)/)?.[1]
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  };

  const voteForSubmissionOnChain = async (challengePublicKey: string, submissionPublicKey: string) => {
    if (!wallet || !connection) {
      return { success: false, error: "Wallet not connected" };
    }
    
    if (!program) {
      return { success: false, error: "Program not initialized" };
    }
  
    try {
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
      
      // Check if the voting treasury token account exists and create it if needed
      let setupTx = null;
      try {
        const votingTokenAccountInfo = await connection.getAccountInfo(votingTreasuryTokenAccount);
        
        if (!votingTokenAccountInfo) {
          console.log("Voting treasury token account doesn't exist, creating it...");
          
          // Create and send the setup transaction
          const createAtaIx = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            votingTreasuryTokenAccount,
            votingTreasuryPubkey,
            CPT_TOKEN_MINT,
            TOKEN_2022_PROGRAM_ID,
            TOKEN_2022_PROGRAM_ID
          );
          
          const setupTransaction = new Transaction().add(createAtaIx);
          setupTransaction.feePayer = wallet.publicKey;
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          setupTransaction.recentBlockhash = blockhash;
          
          const signedSetupTx = await wallet.signTransaction(setupTransaction);
          const setupSig = await connection.sendRawTransaction(signedSetupTx.serialize());
          
          console.log("Setup transaction sent:", setupSig);
          
          // Wait for setup transaction to confirm with enhanced timeout handling
          const setupStatus = await connection.confirmTransaction({
            signature: setupSig,
            blockhash,
            lastValidBlockHeight
          }, 'confirmed');
          
          if (setupStatus.value.err) {
            console.error("Setup transaction failed:", setupStatus.value.err);
            return {
              success: false,
              error: `Failed to create voting treasury account: ${JSON.stringify(setupStatus.value.err)}`
            };
          }
          
          setupTx = setupSig;
          console.log("Created voting treasury token account");
        }
      } catch (err) {
        console.error("Error checking/creating token account:", err);
        return {
          success: false,
          error: "Failed to set up voting treasury account"
        };
      }
      
      // Now prepare the vote transaction
      // Get fresh blockhash for the vote transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      // Prepare the vote instruction
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
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      // Create and send the vote transaction
      const voteTx = new Transaction().add(voteIx);
      voteTx.feePayer = wallet.publicKey;
      voteTx.recentBlockhash = blockhash;
      
      console.log("Signing vote transaction...");
      const signedVoteTx = await wallet.signTransaction(voteTx);
      
      console.log("Sending vote transaction...");
      const signature = await connection.sendRawTransaction(signedVoteTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      console.log("Vote transaction sent! Signature:", signature);
      
      try {
        // Wait for confirmation with enhanced timeout handling
        console.log("Waiting for vote transaction confirmation...");
        const status = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (status.value.err) {
          console.error("Vote transaction confirmed but failed:", status.value.err);
          return {
            success: false,
            error: `Transaction failed: ${JSON.stringify(status.value.err)}`
          };
        }
        
        console.log("Vote successful! Transaction confirmed:", signature);
        return {
          success: true,
          signature,
          setupTransaction: setupTx
        };
      } catch (confirmError) {
        // Handle confirmation timeout
        if (confirmError instanceof Error && confirmError.message.includes("was not confirmed")) {
          console.warn("Transaction confirmation timed out but may still succeed");
          return {
            success: false,
            error: "Transaction submitted but confirmation timed out. Check the transaction status manually.",
            pendingSignature: signature,
            setupTransaction: setupTx
          };
        }
        
        throw confirmError; // Re-throw other errors
      }
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
      
      // Check if the account exists before getting balance
      const accountInfo = await connection.getAccountInfo(votingTreasuryTokenAccount);
      
      let tokenBalance = {
        value: { amount: "0", decimals: 9, uiAmount: 0 }
      };
      
      // Only try to get token balance if account exists
      if (accountInfo) {
        const tokenBalanceResponse = await connection.getTokenAccountBalance(votingTreasuryTokenAccount);
        tokenBalance = {
          value: {
            amount: tokenBalanceResponse.value.amount,
            decimals: tokenBalanceResponse.value.decimals,
            uiAmount: tokenBalanceResponse.value.uiAmount ?? 0 // Convert null to 0
          }
        };
      } else {
        console.log("Voting treasury token account doesn't exist yet, returning zero balance");
      }
      
      // Get the SOL balance of the voting treasury
      const solBalance = await connection.getBalance(votingTreasuryPubkey);
      
      return {
        success: true,
        tokenBalance: tokenBalance.value.uiAmount ?? 0,
        tokenDecimals: tokenBalance.value.decimals,
        tokenAmountRaw: tokenBalance.value.amount,
        solBalance: solBalance / LAMPORTS_PER_SOL,
        votingTreasuryAddress: votingTreasuryPubkey.toString(),
        votingTreasuryTokenAccount: votingTreasuryTokenAccount.toString(),
        accountExists: !!accountInfo
      };
    } catch (error: unknown) {
      console.error("Error fetching voting treasury balance:", error);
      
      let errorMessage = "Failed to get voting treasury balance";
      if (error instanceof Error) {
        errorMessage = error.message;
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
      const challengePubkey = new PublicKey(challengePublicKey);
      
      // IMPORTANT: First fetch the actual on-chain challenge data to get the real creator
      console.log("Fetching challenge account data from blockchain");
      const challengeAccountInfo = await connection.getAccountInfo(challengePubkey);
      
      if (!challengeAccountInfo) {
        return {
          success: false,
          error: "Challenge not found on blockchain"
        };
      }
      
      // Use Anchor to decode the account data
      console.log("Challenge account exists. Trying to deserialize data...");
      
      // Instead of relying on Anchor deserialization which might fail,
      // Let's try to fetch the challenge data from PocketBase but use a workaround
      const pb = new PocketBase('https://api.coinpetitive.com/');
      
      // Get the PocketBase challenge with expanded creator
      console.log("Fetching challenge from PocketBase");
      const pbChallenges = await pb.collection('challenges').getList(1, 1, {
        filter: `onchain_id = "${challengePublicKey}"`,
        expand: 'creator' // Expand the creator relation to get their pubkey
      });
      
      if (pbChallenges.items.length === 0) {
        return {
          success: false,
          error: "Challenge not found in PocketBase"
        };
      }
      
      const pbChallenge = pbChallenges.items[0];
      const pbChallengeId = pbChallenge.id;
      
      // Get creator's pubkey from the expanded creator relation
      let creatorPubkey;
      if (pbChallenge.expand?.creator?.pubkey) {
        creatorPubkey = new PublicKey(pbChallenge.expand.creator.pubkey);
        console.log("Using creator pubkey from PocketBase:", creatorPubkey.toString());
      } else {
        // Fallback to wallet as creator if we can't find the pubkey in PB
        creatorPubkey = wallet.publicKey;
        console.log("Creator pubkey not found in PB, using wallet:", creatorPubkey.toString());
      }
      
      // FOR DEBUGGING - Try all possible combinations:
      // 1. Fetch with regular RPC
      let actualCreatorPubkey = null;
      try {
        console.log("ATTEMPTING DIRECT RPC CALL");
        const accountData = await connection.getAccountInfo(challengePubkey);
        console.log("Challenge account data length:", accountData?.data.length);
        
        if (accountData && accountData.data.length >= 40) {
          const creatorPubkeyBytes = accountData.data.slice(8, 40); // Skip 8-byte discriminator
          actualCreatorPubkey = new PublicKey(creatorPubkeyBytes);
          console.log("Extracted creator from raw account data:", actualCreatorPubkey.toString());
        }
      } catch (rpcError) {
        console.error("Error in RPC extraction:", rpcError);
      }
      
      console.log("Will try with the following creator keys:");
      console.log("1. PocketBase creator:", creatorPubkey.toString());
      if (actualCreatorPubkey) {
        console.log("2. Blockchain extracted creator:", actualCreatorPubkey.toString());
        creatorPubkey = actualCreatorPubkey; // Use the extracted one if available
      }
      
      // Derive the treasury PDA
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), challengePubkey.toBuffer()],
        program.programId
      );
      
      // Step 2: Fetch all video submissions for this challenge from PocketBase
      const pbSubmissions = await pb.collection('video_submitted').getList(1, 100, {
        filter: `challenge = "${pbChallengeId}"`,
        sort: "-vote_count",
        expand: "participant"
      });
      
      if (pbSubmissions.items.length === 0) {
        return {
          success: false,
          error: "No video submissions found for this challenge"
        };
      }
      
      // Determine the winner (submission with highest vote_count)
      const winnerSubmission = pbSubmissions.items[0]; // Already sorted by vote_count desc
      
      console.log("Winner submission:", {
        id: winnerSubmission.id,
        vote_count: winnerSubmission.vote_count,
        participant: winnerSubmission.expand?.participant?.id,
        pubkey: winnerSubmission.expand?.participant?.pubkey
      });
      
      // Get the winner's pubkey
      let winnerPubkey;
      if (winnerSubmission.expand?.participant?.pubkey) {
        winnerPubkey = new PublicKey(winnerSubmission.expand.participant.pubkey);
      } else {
        return {
          success: false,
          error: "Winner's wallet address not found"
        };
      }
      
      console.log("Winner pubkey:", winnerPubkey.toString());
      
      // Find treasury token account
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Find or create winner's token account
      const winnerTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        winnerPubkey
      );
      
      // Check if winner token account exists and create if needed
      const winnerTokenAccountInfo = await connection.getAccountInfo(winnerTokenAccount);
      if (!winnerTokenAccountInfo) {
        console.log("Creating token account for winner:", winnerPubkey.toString());
        
        const createAtaIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
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

      // Get or create creator's token account
      const creatorTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        creatorPubkey
      );
      
      // Check if creator token account exists and create if needed
      const creatorTokenAccountInfo = await connection.getAccountInfo(creatorTokenAccount);
      if (!creatorTokenAccountInfo) {
        console.log("Creating token account for creator:", creatorPubkey.toString());
        
        const createCreatorAtaIx = createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          creatorTokenAccount, 
          creatorPubkey,
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
      
      // Call the finalize_challenge instruction with all accounts
      console.log("Finalizing challenge with accounts:", {
        challenge: challengePubkey.toString(),
        treasury: treasuryPubkey.toString(),
        treasuryToken: treasuryTokenAccount.toString(),
        winner: winnerPubkey.toString(),
        winnerToken: winnerTokenAccount.toString(),
        creator: creatorPubkey.toString(),
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
          creatorTokenAccount: creatorTokenAccount,
          creator: creatorPubkey, // Using the blockchain-extracted creator
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("Successfully finalized challenge! Transaction signature:", tx);
      
      // Update challenge in PocketBase to mark as finalized
      try {
        await pb.collection('challenges').update(pbChallengeId, {
          state: "completed"
        });
      } catch (updateError) {
        console.log("Warning: Could not update challenge state in PocketBase", updateError);
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
      const pb = new PocketBase('https://api.coinpetitive.com/');
      
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
      
      // Get winning submission (highest vote_count)
      let winnerSubmission;
      try {
        const submissions = await pb.collection('video_submitted').getList(1, 100, {
          filter: `challenge = "${pbChallengeId}"`,
          sort: "-vote_count",
          expand: "participant,voters"
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
      
      const voterResults = [];
      let processedCount = 0;
      
      // Process each voter with a public key
      for (let i = 0; i < validVoters.length; i++) {
        const voter = validVoters[i];
        // We've already filtered out null voters, so we can safely assert non-null here
        if (!voter) continue; // Skip if somehow voter is null
        const voterPubkey = new PublicKey(voter.pubkey);
        
        console.log(`Processing voter ${i+1}/${validVoters.length}: ${voter?.username || 'Unknown'} (${voterPubkey.toString().substring(0, 8)}...)`);
        
        // Create voter token account if it doesn't exist
        const voterTokenAccount = getAssociatedTokenAddressSync(
          CPT_TOKEN_MINT,
          voterPubkey,
          false, // Regular wallet, not PDA
          TOKEN_2022_PROGRAM_ID
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
          // Pass the total number of winning voters to correctly distribute the treasury
          const distributeTx = await program.methods
            .distributeVotingTreasury(
              voterPubkey,
              new anchor.BN(validVoters.length) // Pass the winning voters count
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

  const claimCreatorReward = async (challengePublicKey: string) => {
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
      const challengePubkey = new PublicKey(challengePublicKey);
      console.log("Starting creator reward claim for:", challengePublicKey);
      
      // Derive the treasury PDA from the challenge
      const [treasuryPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), challengePubkey.toBuffer()],
        program.programId
      );
      
      // Find treasury token account
      const treasuryTokenAccount = getAssociatedTokenAddressSync(
        CPT_TOKEN_MINT,
        treasuryPubkey,
        true,
        TOKEN_2022_PROGRAM_ID
      );
      
      // Get creator token account
      const creatorTokenAccount = getAssociatedToken2022AddressSync(
        CPT_TOKEN_MINT,
        wallet.publicKey
      );
      
      console.log("Claiming creator reward with accounts:", {
        challenge: challengePubkey.toString(),
        treasury: treasuryPubkey.toString(),
        treasuryToken: treasuryTokenAccount.toString(),
        creator: wallet.publicKey.toString(),
        creatorToken: creatorTokenAccount.toString()
      });
      
      // Check the balance before claiming
      try {
        const balanceBefore = await connection.getTokenAccountBalance(treasuryTokenAccount);
        console.log("Treasury balance before claim:", balanceBefore.value.uiAmount);
      } catch (e) {
        console.log("Could not fetch treasury balance before claim");
      }
      
      // Call the claim instruction
      const tx = await program.methods
        .claimCreatorReward()
        .accounts({
          creator: wallet.publicKey,
          challenge: challengePubkey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          treasury: treasuryPubkey,
          treasuryTokenAccount: treasuryTokenAccount,
          creatorTokenAccount: creatorTokenAccount,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("Successfully claimed creator reward! Transaction signature:", tx);
      
      return {
        success: true,
        signature: tx
      };
    } catch (error) {
      console.error("Error claiming creator reward:", error);
      
      let errorMessage = "Failed to claim creator reward";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific error types
        if (errorMessage.includes("ChallengeStillActive")) {
          errorMessage = "Challenge is still active. Finalize it before claiming rewards.";
        } else if (errorMessage.includes("InvalidCreator")) {
          errorMessage = "Only the challenge creator can claim the remaining rewards.";
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  return {
    wallet,
    program,
    createChallenge,
    participateInChallenge,
    submitVideoOnChain,
    voteForSubmissionOnChain,
    getTreasuryBalance,
    getVotingTreasuryBalance,
    finalizeChallenge,
    finalizeVotingTreasury,
    claimCreatorReward
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
    accountExists?: boolean;
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
  claimCreatorReward: (challengePublicKey: string) => Promise<{
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