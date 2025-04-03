import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Coinpetitive } from "../target/types/coinpetitive";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { 
  getAssociatedTokenAddressSync, 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
import { Connection } from '@solana/web3.js';


describe("coinpetitive", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Coinpetitive as Program<Coinpetitive>;
  
  const metadata_seed = "metadata"
  const token_metadata_program_id = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  )
  
  
  const mint_seed = "mint";
  const payer = program.provider.publicKey;

  const metadata = {
    name : "Coinpetitive",
    symbol : "CPT",
    uri : "https://gateway.pinata.cloud/ipfs/bafkreier252mzmzb5jdmhbiubo6bndnpplnlvh7ynuixargdmrxi4ci2ay",
    decimals : 7
  }
  


  const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(mint_seed)], 
    program.programId
  );
  
  const [metadataAddress] = anchor.web3.PublicKey
    .findProgramAddressSync([
      Buffer.from("metadata"),
      token_metadata_program_id.toBuffer(),
      mint.toBuffer()
    ], 
    token_metadata_program_id
  );
  
  const mint_addr = new anchor.web3.PublicKey("wc3eLDaYLrPwD6Xacvb4xfXD1Cu6Mcw7ZbWopNynNYT");
  const recipientPublicKey = new anchor.web3.PublicKey("8E1TjSr2jTPXDMiHFBDytLQS2orkmzTmgM29itFvs66g");
  const recipientTokenAccount = getAssociatedTokenAddressSync(mint_addr, recipientPublicKey);
  const senderPublicKey = new anchor.web3.PublicKey("6wBiHEqFQPQ1muidbziVANUHVvLFuAt4snmnJmigg16Z");
  const senderTokenAccount = getAssociatedTokenAddressSync(mint_addr, senderPublicKey);
  

    init_token(program, mint, metadataAddress, payer, token_metadata_program_id, metadata);


    mint_cpv(mint, payer, program, metadata, 21_000_000);

    //transfer_to_founder(mint_addr, program, payer, metadata, senderTokenAccount, 500000);

    //check_wallet_milestones(mint_addr, program, payer, metadata);


})



function init_token(program , mint , metadataAddress , payer , token_metadata_program_id , metadata){
    it("Initialize", async () => {
      const info = await program.provider.connection.getAccountInfo(mint);
      if (info) {
        console.log("already initialized!")
        return; 
      }
      console.log("Mint not found. Initializing Program...");
    
      const context = {
        metadata: metadataAddress,
        mint,
        payer,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        tokenMetadataProgram: token_metadata_program_id,
      };
    
    
      const txHash = await program.methods
        .initToken(metadata)
        .accounts(context)
        .rpc();
      await program.provider.connection.confirmTransaction(txHash, "finalized");
      console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
      const newInfo = await program.provider.connection.getAccountInfo(mint);
      assert(newInfo, "  Mint should be initialized.");
    });
}

function mint_cpv(mint, payer, program, metadata, supply){
  it("mint tokens", async () => {
        console.log("============================");
        console.log("Minting to token address:", mint.toString());
        console.log("Supply amount:", supply);
        console.log("============================");
        
        const destination = await anchor.utils.token.associatedAddress({
          mint: mint,
          owner: payer,
        });
  
        let initialBalance = 0;
        try {
          const balance = await program.provider.connection.getTokenAccountBalance(destination);
          initialBalance = balance.value.uiAmount;
          console.log(`  Initial balance: ${initialBalance}`);
        } catch (e) {
          console.log("  No initial balance found");
        }
    
        const context = {
          mint,
          destination,
          payer,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        };
    
        const amountToMint = supply;
        const amount = new anchor.BN(amountToMint * Math.pow(10, metadata.decimals));
        
        console.log(`  About to mint ${amountToMint} tokens to ${payer.toString()}`);
        
        const txHash = await program.methods
          .mintToken(amount)
          .accounts(context)
          .rpc();
        await program.provider.connection.confirmTransaction(txHash);
        console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    
        await new Promise(resolve => setTimeout(resolve, 2000));
    
        const postBalance = (
          await program.provider.connection.getTokenAccountBalance(destination)
        ).value.uiAmount;
        
        console.log(`  Final balance: ${postBalance}`);
        assert.equal(
          postBalance, 
          initialBalance + amountToMint, 
          "Balance should be increased by exactly the minted amount"
        );
      });
}

function transfer_to_founder(mint_addr , program , payer , metadata , senderTokenAccount , tk){
  it("transfers tokens to the founder's ATA", async () => {
    
    const founderWallet = new anchor.web3.PublicKey("FuFzoMF5xTwZego84fRoscnart4dPYNkpHho2UBe7NDt");
    const recipientAta = getAssociatedTokenAddressSync(mint_addr, founderWallet);
    
      try {
        const accountInfo = await program.provider.connection.getAccountInfo(recipientAta);
        if (!accountInfo) {
          console.log("ATA does not exist. Creating ATA...");
          const createAtaIx = createAssociatedTokenAccountInstruction(
            payer,          // payer of the transaction
            recipientAta,   // the ATA to be created
            founderWallet,  // owner of the ATA
            mint_addr       // token mint
          );
          const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
          await program.provider.sendAndConfirm(createAtaTx);
          console.log("Created founder's associated token account");
        } else {
          console.log("Found existing ATA for founder.");
        }
      } catch (e) {
        console.error("Error checking ATA; attempting to create:", e);
        const createAtaIx = createAssociatedTokenAccountInstruction(
          payer,
          recipientAta,
          founderWallet,
          mint_addr
        );
        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
        await program.provider.sendAndConfirm(createAtaTx);
      }
    
  

      const amountToMint = tk;
      const amount = new anchor.BN(amountToMint * Math.pow(10, metadata.decimals));
      
      const txSignature = await program.methods
        .transferFounder(amount)
        .accounts({
          from: senderTokenAccount,
          to: recipientAta,
          authority: payer,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID
        })
        .rpc();
      console.log(`Transfer successful: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
    });
}

function transfer_to_dev(mint_addr , program , payer , metadata , senderTokenAccount , tk){
  it("transfers tokens to the dev's ATA", async () => {
    
      const founderWallet = new anchor.web3.PublicKey("DhCu49epRCawP9Yp2ZoatzSvfmTewi2x73xEM6Vb2kh2");
      const recipientAta = getAssociatedTokenAddressSync(mint_addr, founderWallet);
      
        try {
          const accountInfo = await program.provider.connection.getAccountInfo(recipientAta);
          if (!accountInfo) {
            console.log("ATA does not exist. Creating ATA...");
            const createAtaIx = createAssociatedTokenAccountInstruction(
              payer,          
              recipientAta,   // the ATA to be created
              founderWallet,  // owner of the ATA
              mint_addr       // token mint
            );
            const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
            await program.provider.sendAndConfirm(createAtaTx);
            console.log("Created founder's associated token account");
          } else {
            console.log("Found existing ATA for dev team.");
          }
        } catch (e) {
          console.error("Error checking ATA; attempting to create:", e);
          const createAtaIx = createAssociatedTokenAccountInstruction(
            payer,
            recipientAta,
            founderWallet,
            mint_addr
          );
          const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
          await program.provider.sendAndConfirm(createAtaTx);
        }
      
    
  
        const amountToMint = tk; //500k
        const amount = new anchor.BN(amountToMint * Math.pow(10, metadata.decimals));
        
        const txSignature = await program.methods
          .transferDev(amount)
          .accounts({
            from: senderTokenAccount,
            to: recipientAta,
            authority: payer,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID
          })
          .rpc();
        console.log(`Transfer successful: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
      });
}

function transfer_to_marketing(mint_addr, program, payer, metadata, senderTokenAccount, tk) {
  it("transfers tokens to the marketing ATA", async () => {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
      units: 600000  // Increased from 400000 to 600000
    });
    
    const marketingWallet = new anchor.web3.PublicKey("973DKZUVJQqo11pXs74KzB1jwjrMMXLueBBiRCwi9Eh");
    const recipientAta = getAssociatedTokenAddressSync(mint_addr, marketingWallet);
    
    try {
      const accountInfo = await program.provider.connection.getAccountInfo(recipientAta);
      if (!accountInfo) {
        console.log("ATA does not exist. Creating ATA...");
        const createAtaIx = createAssociatedTokenAccountInstruction(
          payer,
          recipientAta,
          marketingWallet,
          mint_addr
        );
        const createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
        await program.provider.sendAndConfirm(createAtaTx);
        console.log("Created marketing's associated token account");
      } else {
        console.log("Found existing ATA for marketing team.");
      }
    } catch (e) {
      console.error("Error checking ATA; attempting to create:", e);
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payer,
        recipientAta,
        marketingWallet,
        mint_addr
      );
      const createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
      await program.provider.sendAndConfirm(createAtaTx);
    }

    const amountToMint = tk;
    const amount = new anchor.BN(amountToMint * Math.pow(10, metadata.decimals));
    
    const txSignature = await program.methods
      .marketingTransfer(amount)
      .accounts({
        from: senderTokenAccount,
        to: recipientAta,
        authority: payer,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID
      })
      .preInstructions([modifyComputeUnits])
      .rpc();
    console.log(`Transfer successful: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
  });
}



// done
function check_wallet_milestones(mint_addr, program, payer, metadata) {
  it("continuously checks wallet milestones every 5 seconds", async function() {
    // Set a longer timeout for this test (default is 2000ms)
    this.timeout(3600000); // 1 hour
    
    console.log("============================");
    console.log("Starting continuous wallet milestone monitoring...");
    console.log("Press Ctrl+C to stop the test");
    console.log("============================");
    
    // Define wallet milestones (in production these would be 250k, 500k, 1M)
    // For testing, we use much smaller numbers
    const WALLET_MILESTONES = [
      { threshold: 250000, index: 4, name: "Test 250k wallets" },
      { threshold: 500000, index: 5, name: "Test 500k wallets" },
      { threshold: 1000000, index: 6, name: "Test 1M wallets" }
    ];
    
    // Get token state address
    const [tokenStateAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token_state")],
      program.programId
    );
    
    // Keep track of milestones we have locally minted for
    const locallyMintedMilestones = new Set();
    
    // Run continuous monitoring
    const checkInterval = 5000; // 5 seconds
    let checkCount = 0;
    
    // Use a promise that we deliberately don't resolve
    // This keeps the test running until manually terminated
    return new Promise(async () => {
      while (true) {
        try {
          checkCount++;
          console.log(`\n[Check #${checkCount}] ${new Date().toLocaleTimeString()}`);
          
          // Find all token accounts for this mint
          console.log("Scanning for wallet holders...");
          const connection = program.provider.connection;
          const tokenAccounts = await connection.getProgramAccounts(
            TOKEN_PROGRAM_ID,
            {
              filters: [
                { dataSize: 165 }, // Token account size
                { memcmp: { offset: 0, bytes: mint_addr.toBase58() } }, // Filter by mint
              ],
            }
          );
          
          // Count unique wallet addresses with non-zero balance
          const uniqueWallets = new Set();
          for (const account of tokenAccounts) {
            const data = account.account.data;
            const owner = new PublicKey(data.slice(32, 64));
            const amount = Number(data.readBigUInt64LE(64));
            
            if (amount > 0) {
              uniqueWallets.add(owner.toBase58());
            }
          }
          
          const walletCount = uniqueWallets.size;
          console.log(`Found ${walletCount} unique wallets with non-zero balances`);
          
          // Always fetch fresh token state on each iteration
          const tokenState = await program.account.tokenState.fetch(tokenStateAddress);
          const mintConditionsUsed = tokenState.mintConditionsUsed;
          
          // Debug logging
          console.log("Current mint conditions used:", mintConditionsUsed);
          
          // Check each milestone
          let mintingExecuted = false;
          for (const milestone of WALLET_MILESTONES) {
            if (walletCount >= milestone.threshold) {
              console.log(`🎉 Milestone reached: ${milestone.name} (${walletCount} wallets)`);
              
              // Triple check to avoid duplicate minting:
              // 1. Check on-chain state
              // 2. Check local tracking
              const onChainUsed = mintConditionsUsed[milestone.index];
              const locallyUsed = locallyMintedMilestones.has(milestone.index);
              
              if (onChainUsed || locallyUsed) {
                console.log(`Milestone ${milestone.name} already used for minting (on-chain: ${onChainUsed}, local: ${locallyUsed})`);
                continue;
              }
              
              // Check time restriction
              const currentTimestamp = Math.floor(Date.now() / 1000);
              const lastMintTimestamp = tokenState.lastMintTimestamp.toNumber();
              const MIN_TIME_BETWEEN_MINTS = 365 * 24 * 60 * 60; // 1 year in seconds
              
              // For testing, we can bypass the time restriction
              // In production, uncomment this:
              /*
              if (currentTimestamp - lastMintTimestamp < MIN_TIME_BETWEEN_MINTS) {
                const daysRemaining = Math.ceil((MIN_TIME_BETWEEN_MINTS - (currentTimestamp - lastMintTimestamp)) / (24 * 60 * 60));
                console.log(`Time restriction applies: ${daysRemaining} days remaining`);
                continue;
              }
              */
              
              console.log(`💰 Minting 5M tokens for milestone: ${milestone.name}`);
              
              try {
                // Set up destination for minted tokens
                const destination = await anchor.utils.token.associatedAddress({
                  mint: mint_addr,
                  owner: payer,
                });
                
                // Mint 5M tokens (MINT_INCREMENT)
                const mintAmount = new anchor.BN(5_000_000 * Math.pow(10, metadata.decimals));
                
                const txHash = await program.methods
                  .mintToken(mintAmount)
                  .accounts({
                    mint: mint_addr,
                    destination,
                    tokenState: tokenStateAddress,
                    payer,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                  })
                  .rpc();
                
                // Wait for confirmation
                await program.provider.connection.confirmTransaction(txHash);
                  
                console.log(`✅ Milestone mint successful! TX: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
                
                // Mark as locally minted to prevent duplicate mints
                locallyMintedMilestones.add(milestone.index);
                
                // Flag that minting was executed
                mintingExecuted = true;
                
                // Only mint for one milestone at a time
                break;
              } catch (error) {
                console.error(`❌ Error minting for milestone:`, error);
              }
            }
          }
          
          // Extra safety: If we did a mint, wait a few seconds and refresh state
          if (mintingExecuted) {
            console.log("Waiting for state to update after minting...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Verify the milestone was correctly marked as used on-chain
            const updatedTokenState = await program.account.tokenState.fetch(tokenStateAddress);
            console.log("Updated mint conditions used after minting:", updatedTokenState.mintConditionsUsed);
          }
          
          console.log(`Monitoring active... Next check in 5 seconds`);
          
          // Wait 5 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        } catch (error) {
          console.error("Error during milestone check:", error);
          // Continue the loop even after errors
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
      }
    });
  });
}










function check_entry_fee_milestones(mint_addr, program, payer, metadata) {
  it("continuously checks entry fee milestones every 5 seconds", async function() {
    // Set a longer timeout for this test (default is 2000ms)
    this.timeout(3600000); // 1 hour
    
    console.log("============================");
    console.log("Starting continuous entry fee milestone monitoring...");
    console.log("Press Ctrl+C to stop the test");
    console.log("============================");
    
    // Define entry fee milestones based on tokenomics
    const ENTRY_FEE_MILESTONES = [
      { threshold: 50_000_000, index: 2, name: "50M total entry fees" },
      { threshold: 100_000_000, index: 3, name: "100M total entry fees" }
    ];
    
    // For testing, you might want to use smaller thresholds:
    // const ENTRY_FEE_MILESTONES = [
    //   { threshold: 5, index: 2, name: "Test 5 entry fees" },
    //   { threshold: 10, index: 3, name: "Test 10 entry fees" }
    // ];
    
    // Get token state address
    const [tokenStateAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token_state")],
      program.programId
    );
    
    // Keep track of milestones we have locally minted for
    const locallyMintedMilestones = new Set();
    
    // Run continuous monitoring
    const checkInterval = 5000; // 5 seconds
    let checkCount = 0;
    
    // Use a promise that we deliberately don't resolve
    // This keeps the test running until manually terminated
    return new Promise(async () => {
      while (true) {
        try {
          checkCount++;
          console.log(`\n[Check #${checkCount}] ${new Date().toLocaleTimeString()}`);
          
          // Fetch token state to get total entry fees
          const tokenState = await program.account.tokenState.fetch(tokenStateAddress);
          const totalEntryFees = tokenState.totalEntryFees.toNumber();
          const mintConditionsUsed = tokenState.mintConditionsUsed;
          
          console.log(`Current total entry fees: ${totalEntryFees}`);
          console.log("Current mint conditions used:", mintConditionsUsed);
          
          // Check each milestone
          let mintingExecuted = false;
          for (const milestone of ENTRY_FEE_MILESTONES) {
            if (totalEntryFees >= milestone.threshold) {
              console.log(`🎉 Milestone reached: ${milestone.name} (${totalEntryFees} fees paid)`);
              
              // Triple check to avoid duplicate minting:
              // 1. Check on-chain state
              // 2. Check local tracking
              const onChainUsed = mintConditionsUsed[milestone.index];
              const locallyUsed = locallyMintedMilestones.has(milestone.index);
              
              if (onChainUsed || locallyUsed) {
                console.log(`Milestone ${milestone.name} already used for minting (on-chain: ${onChainUsed}, local: ${locallyUsed})`);
                continue;
              }
              
              // Check time restriction
              const currentTimestamp = Math.floor(Date.now() / 1000);
              const lastMintTimestamp = tokenState.lastMintTimestamp.toNumber();
              const MIN_TIME_BETWEEN_MINTS = 365 * 24 * 60 * 60; // 1 year in seconds
              
              // For testing, we can bypass the time restriction
              // In production, uncomment this:
              /*
              if (currentTimestamp - lastMintTimestamp < MIN_TIME_BETWEEN_MINTS) {
                const daysRemaining = Math.ceil((MIN_TIME_BETWEEN_MINTS - (currentTimestamp - lastMintTimestamp)) / (24 * 60 * 60));
                console.log(`Time restriction applies: ${daysRemaining} days remaining`);
                continue;
              }
              */
              
              console.log(`💰 Minting 5M tokens for milestone: ${milestone.name}`);
              
              try {
                // Set up destination for minted tokens
                const destination = await anchor.utils.token.associatedAddress({
                  mint: mint_addr,
                  owner: payer,
                });
                
                // Mint 5M tokens (MINT_INCREMENT)
                const mintAmount = new anchor.BN(5_000_000 * Math.pow(10, metadata.decimals));
                
                const txHash = await program.methods
                  .mintToken(mintAmount)
                  .accounts({
                    mint: mint_addr,
                    destination,
                    tokenState: tokenStateAddress,
                    payer,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                  })
                  .rpc();
                
                // Wait for confirmation
                await program.provider.connection.confirmTransaction(txHash);
                  
                console.log(`✅ Entry Fee Milestone mint successful! TX: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
                
                // Mark as locally minted to prevent duplicate mints
                locallyMintedMilestones.add(milestone.index);
                
                // Flag that minting was executed
                mintingExecuted = true;
                
                // Only mint for one milestone at a time
                break;
              } catch (error) {
                console.error(`❌ Error minting for milestone:`, error);
              }
            } else {
              console.log(`Milestone ${milestone.name} not yet reached: ${totalEntryFees}/${milestone.threshold} (${((totalEntryFees/milestone.threshold)*100).toFixed(2)}%)`);
            }
          }
          
          // Extra safety: If we did a mint, wait a few seconds and refresh state
          if (mintingExecuted) {
            console.log("Waiting for state to update after minting...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Verify the milestone was correctly marked as used on-chain
            const updatedTokenState = await program.account.tokenState.fetch(tokenStateAddress);
            console.log("Updated mint conditions used after minting:", updatedTokenState.mintConditionsUsed);
          }
          
          console.log(`Entry fee monitoring active... Next check in 5 seconds`);
          
          // Wait 5 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        } catch (error) {
          console.error("Error during entry fee milestone check:", error);
          // Continue the loop even after errors
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
      }
    });
  });
}


function check_challenge_milestones(mint_addr, program, payer, metadata) {
  it("continuously checks challenge completion milestones every 5 seconds", async function() {
    // Set a longer timeout for this test
    this.timeout(3600000); // 1 hour
    
    console.log("============================");
    console.log("Starting continuous challenge milestone monitoring...");
    console.log("Press Ctrl+C to stop the test");
    console.log("============================");
    
    // Define challenge milestones based on tokenomics
    const CHALLENGE_MILESTONES = [
      { threshold: 5_000_000, index: 0, name: "5M challenges completed" },
      { threshold: 10_000_000, index: 1, name: "10M challenges completed" }
    ];
    
    // For testing, you might want to use smaller thresholds:
    // const CHALLENGE_MILESTONES = [
    //   { threshold: 5, index: 0, name: "Test 5 challenges" },
    //   { threshold: 10, index: 1, name: "Test 10 challenges" }
    // ];
    
    // Get token state address
    const [tokenStateAddress] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token_state")],
      program.programId
    );
    
    // Keep track of milestones we have locally minted for
    const locallyMintedMilestones = new Set();
    
    // Run continuous monitoring
    const checkInterval = 5000; // 5 seconds
    let checkCount = 0;
    
    // Use a promise that we deliberately don't resolve
    // This keeps the test running until manually terminated
    return new Promise(async () => {
      while (true) {
        try {
          checkCount++;
          console.log(`\n[Check #${checkCount}] ${new Date().toLocaleTimeString()}`);
          
          // Fetch token state to get total challenges completed
          const tokenState = await program.account.tokenState.fetch(tokenStateAddress);
          const totalChallenges = tokenState.challengesCompleted.toNumber();
          const mintConditionsUsed = tokenState.mintConditionsUsed;
          
          console.log(`Current total challenges completed: ${totalChallenges}`);
          console.log("Current mint conditions used:", mintConditionsUsed);
          
          // Check each milestone
          let mintingExecuted = false;
          for (const milestone of CHALLENGE_MILESTONES) {
            if (totalChallenges >= milestone.threshold) {
              console.log(`🎉 Milestone reached: ${milestone.name} (${totalChallenges} challenges)`);
              
              // Triple check to avoid duplicate minting:
              // 1. Check on-chain state
              // 2. Check local tracking
              const onChainUsed = mintConditionsUsed[milestone.index];
              const locallyUsed = locallyMintedMilestones.has(milestone.index);
              
              if (onChainUsed || locallyUsed) {
                console.log(`Milestone ${milestone.name} already used for minting (on-chain: ${onChainUsed}, local: ${locallyUsed})`);
                continue;
              }
              
              // Check time restriction
              const currentTimestamp = Math.floor(Date.now() / 1000);
              const lastMintTimestamp = tokenState.lastMintTimestamp.toNumber();
              const MIN_TIME_BETWEEN_MINTS = 365 * 24 * 60 * 60; // 1 year in seconds
              
              // For testing, we can bypass the time restriction
              // In production, uncomment this:
              /*
              if (currentTimestamp - lastMintTimestamp < MIN_TIME_BETWEEN_MINTS) {
                const daysRemaining = Math.ceil((MIN_TIME_BETWEEN_MINTS - (currentTimestamp - lastMintTimestamp)) / (24 * 60 * 60));
                console.log(`Time restriction applies: ${daysRemaining} days remaining`);
                continue;
              }
              */
              
              console.log(`💰 Minting 5M tokens for milestone: ${milestone.name}`);
              
              try {
                // Set up destination for minted tokens
                const destination = await anchor.utils.token.associatedAddress({
                  mint: mint_addr,
                  owner: payer,
                });
                
                // Mint 5M tokens (MINT_INCREMENT)
                const mintAmount = new anchor.BN(5_000_000 * Math.pow(10, metadata.decimals));
                
                const txHash = await program.methods
                  .mintToken(mintAmount)
                  .accounts({
                    mint: mint_addr,
                    destination,
                    tokenState: tokenStateAddress,
                    payer,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                  })
                  .rpc();
                
                // Wait for confirmation
                await program.provider.connection.confirmTransaction(txHash);
                  
                console.log(`✅ Challenge Milestone mint successful! TX: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
                
                // Mark as locally minted to prevent duplicate mints
                locallyMintedMilestones.add(milestone.index);
                
                // Flag that minting was executed
                mintingExecuted = true;
                
                // Only mint for one milestone at a time
                break;
              } catch (error) {
                console.error(`❌ Error minting for milestone:`, error);
              }
            } else {
              console.log(`Milestone ${milestone.name} not yet reached: ${totalChallenges}/${milestone.threshold} (${((totalChallenges/milestone.threshold)*100).toFixed(2)}%)`);
            }
          }
          
          // Extra safety: If we did a mint, wait a few seconds and refresh state
          if (mintingExecuted) {
            console.log("Waiting for state to update after minting...");
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Verify the milestone was correctly marked as used on-chain
            const updatedTokenState = await program.account.tokenState.fetch(tokenStateAddress);
            console.log("Updated mint conditions used after minting:", updatedTokenState.mintConditionsUsed);
          }
          
          console.log(`Challenge monitoring active... Next check in 5 seconds`);
          
          // Wait 5 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        } catch (error) {
          console.error("Error during challenge milestone check:", error);
          // Continue the loop even after errors
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
      }
    });
  });
}