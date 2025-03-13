import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Coinpetitive } from "../target/types/coinpetitive";
import { BN } from "@coral-xyz/anchor";
import { assert } from "chai";
import { ComputeBudgetProgram, PublicKey } from "@solana/web3.js";
import { 
  getAssociatedTokenAddressSync, 
  createAssociatedTokenAccountInstruction 
} from "@solana/spl-token";
import { web3 } from "@project-serum/anchor";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
import { Connection } from '@solana/web3.js';

// Configure the local cluster connection
const connection = new Connection('http://localhost:8899', 'confirmed');

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
    symbol : "CPV",
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
  
  const mint_addr = new anchor.web3.PublicKey("Dazs8dzwT7iR55L576WRaijEBF6RMJUHskErrFx4fwJ9");
  const recipientPublicKey = new anchor.web3.PublicKey("8E1TjSr2jTPXDMiHFBDytLQS2orkmzTmgM29itFvs66g");
  const recipientTokenAccount = getAssociatedTokenAddressSync(mint_addr, recipientPublicKey);
  const senderPublicKey = new anchor.web3.PublicKey("3EqDtdVGZistkvBr4gchmjVeqdCHYdUuVLQSMtPM2bTD");
  const senderTokenAccount = getAssociatedTokenAddressSync(mint_addr, senderPublicKey);
  
  
  //initialize the token & token metadata and it willskip if the token exists already
  //init_token(program, mint, metadataAddress, payer, token_metadata_program_id, metadata)
  //it will mint 21M tokens 
  //mint_cpv(mint, payer, program, metadata, 21000000)
  //transfer tokens to the parties mentioned in the doc
  //transfer to founder wallet 1.1M
  //transfer_to_founder(mint_addr, program, payer, metadata, senderTokenAccount, 1100000)
  //tranfer to dev team wallet 500K
  //transfer_to_dev(mint_addr, program, payer, metadata, senderTokenAccount, 500000)
  //transfer to marketing affiliator wallet 500k
  //transfer_to_marketing(mint_addr, program, payer, metadata, senderTokenAccount, 500000)
  //milestones
  //milestone_1(mint, payer, program, metadata, 5000000)
  //milestone_2(mint, payer, program, metadata, 5000000)
  //milestone_3(mint, payer, program, metadata, 5000000)
  //milestone_4(mint, payer, program, metadata, 5000000)
  //milestone_5(mint, payer, program, metadata, 5000000)
  //milestone_6(mint, payer, program, metadata, 5000000)
  //milestone_7(mint, payer, program, metadata, 5000000)
  //milestone_8(mint, payer, program, metadata, 5000000)
  
    
  /*
  it("pays for challenge creation", async () => {
      // Generate keypairs
      const fromWallet = web3.Keypair.generate();
      const toWallet = new PublicKey("8zhGg2MhHb4aGDa62jymyUTT3mkzQAyqPJme4Cyn6iYh");
      console.log("\n=== Generated Wallet Addresses ===");
      console.log("From wallet:", fromWallet.publicKey.toString());
      console.log("To wallet:", toWallet.toString());
      console.log("================================\n");
      console.log("Generated keypairs, waiting 20 seconds before proceeding...");
      
      await new Promise(resolve => setTimeout(resolve, 20000));
      
      console.log("Wait complete, proceeding with transaction...");
  
      const amount = new anchor.BN(1 * web3.LAMPORTS_PER_SOL);
    
      try {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
          units: 400000
        });
    
        const tx = await program.methods
          .payChallenge(amount)
          .accounts({
            from: fromWallet.publicKey,
            to: toWallet,
          })
          .signers([fromWallet])
          .transaction();
          
        const txhash = await web3.sendAndConfirmTransaction(program.provider.connection, tx, [fromWallet]);
        console.log(`https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  
        const toBalance = await program.provider.connection.getBalance(toWallet);
        
        assert.strictEqual(
          toBalance,
          amount.toNumber(),
          "Recipient should have received exactly 1 SOL"
        );
      } catch (error) {
        console.error("Transfer failed:", error);
        throw error;
      }
  });

  it("creates a challenge", async () => {
    // Generate a keypair for the challenge account
    const challengeKeypair = web3.Keypair.generate();
    
    console.log("\n=== Generated Challenge Account ===");
    console.log("Challenge account:", challengeKeypair.publicKey.toString());
    console.log("================================\n");
    
    console.log("Waiting 2 minutes before proceeding with transaction...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log("Proceeding with challenge creation...");
  
    try {
      const description = "Test Challenge Description";
      const reward = new BN(0.0001 * web3.LAMPORTS_PER_SOL); // 0.0001 SOL reward
  
      const tx = await program.methods
        .createChallenge(description, reward)
        .accounts({
          user: program.provider.publicKey,
          challenge: challengeKeypair.publicKey,
 
        })
        .signers([challengeKeypair])
        .rpc();
  
      console.log(`Transaction URL: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  

      const challengeAccount = await program.account.challenge.fetch(
        challengeKeypair.publicKey
      );
  
      // Verify the challenge was created correctly
      assert.equal(
        challengeAccount.creator.toBase58(),
        program.provider.publicKey.toBase58(),
        "Incorrect challenge creator"
      );
      assert.equal(
        challengeAccount.description,
        description,
        "Incorrect challenge description"
      );
      assert.equal(
        challengeAccount.reward.toNumber(),
        reward.toNumber(),
        "Incorrect challenge reward"
      );
      assert.equal(
        challengeAccount.isActive,
        true,
        "Challenge should be active"
      );
      assert.equal(
        challengeAccount.participants.length,
        0,
        "Challenge should start with no participants"
      );
  
    } catch (error) {
      console.error("Challenge creation failed:", error);
      throw error;
    }
  });
*/
/*
  it("creates & joins a challenge", async () => {
      // Generate keypair for participant only - we'll reuse existing challenge
      const participantKeypair = web3.Keypair.generate();
      // Create a challenge first
      const challengeKeypair = web3.Keypair.generate();
      
      console.log("\n=== Generated Accounts ===");
      console.log("Participant account:", participantKeypair.publicKey.toString());
      console.log("Challenge account:", challengeKeypair.publicKey.toString());
      console.log("=======================\n");
      
      try {
          // First create the challenge
          const description = "Test Challenge Description";
          const reward = new BN(0.0001 * web3.LAMPORTS_PER_SOL);
  
          console.log("Creating challenge first...");
          await program.methods
              .createChallenge(description, reward)
              .accounts({
                  user: program.provider.publicKey,
                  challenge: challengeKeypair.publicKey,
              })
              .signers([challengeKeypair])
              .rpc();
  
          console.log("Challenge created, waiting 30 seconds before joining...");
          await new Promise(resolve => setTimeout(resolve, 30000));
  
          // Now join the challenge
          console.log("Attempting to join challenge...");
          const tx = await program.methods
              .joinChallenge()
              .accounts({
                  user: participantKeypair.publicKey,
                  challenge: challengeKeypair.publicKey,
              })
              .signers([participantKeypair])
              .rpc();
  
          console.log(`Transaction URL: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
  
          // Verify participation
          const challengeAccount = await program.account.challenge.fetch(
              challengeKeypair.publicKey
          );
  
          assert.include(
              challengeAccount.participants.map(p => p.toBase58()),
              participantKeypair.publicKey.toBase58(),
              "Participant should be added to challenge"
          );
          
      } catch (error) {
          console.error("Challenge operation failed:", error);
          throw error;
      }
  });*/


  
    
  
})




function pay_challenge(program){
  it("pays for challenge creation", async () => {
    const payer = program.provider.publicKey;
    const recipientWallet = new anchor.web3.PublicKey("wa7YMAsw23DkXEhV2F5Lqs6w7aHhNdeWB1cUFVMXeRr"); // Your specific wallet address
    
    const context = {
      user: payer,
      recipientWallet: recipientWallet,
      systemProgram: anchor.web3.SystemProgram.programId,
    };
    
    // Optional: Increase compute budget if needed
    const modifyComputeUnits = anchor.web3.ComputeBudgetProgram.setComputeUnitLimit({
      units: 400000 // Request more compute units
    });
    
    try {
      const txHash = await program.methods
        .payChallenge()
        .accounts(context)
        .preInstructions([modifyComputeUnits]) // Optional: Include this line if needed
        .rpc();
      
      await program.provider.connection.confirmTransaction(txHash);
      console.log(`Transaction: https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
    } catch (error) {
      console.error("Full error details:", error);
      throw error;
    }
  });
}











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



function mint_cpv(mint , payer , program , metadata , supply){
  it("mint tokens", async () => {
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
          "Balance should be increased by exactly 2 tokens"
        );
      });
}


function transfer_to_founder(mint_addr , program , payer , metadata , senderTokenAccount , tk){
  it("transfers tokens to the founder's ATA", async () => {
    
    const founderWallet = new anchor.web3.PublicKey("5w3VpTacYmcCBXygAxFoCDfG4R11q9dbj4WGLVswweKE");
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














// 5 M challenges complete
function milestone_1(mint , payer , program , metadata , supply){
  let challenges = 0;
  for (challenges; challenges <= 5; ++challenges){
    console.log("challenge : ", challenges);
    if(challenges == 5){
      console.log("minting 5M tokens...")
      mint_cpv(mint, payer, program, metadata, supply)
    }
  }
}

//10 M challenges complete
function milestone_2(mint , payer , program , metadata , supply){
  let challenges = 0;
  for (challenges; challenges <= 10; ++challenges){
    console.log("challenge : ", challenges);
    if(challenges == 5){
      console.log("minting 5M tokens...")
      mint_cpv(mint, payer, program, metadata, supply)
    }
  }
}


//50M token entry fee
function milestone_3(mint , payer , program , metadata , supply){
  let fee = 0;
  for (fee; fee <= 5; ++fee){
    console.log("entry fee number : ", fee);
    if(fee == 5){
      console.log("minting 5M tokens...")
      mint_cpv(mint, payer, program, metadata, supply)
    }
  }
}

//100M entry fee payed
function milestone_4(mint , payer , program , metadata , supply){
  let fee = 0;
  for (fee; fee <= 100; ++fee){
    console.log("entry fee : ", fee);
    if(fee == 100){
      console.log("minting 5M tokens...")
      mint_cpv(mint, payer, program, metadata, supply)
    }
  }
}


//250K unique wallets holding tokens
function milestone_5(mint , payer , program , metadata , supply){
  let wallets = 0;
  for (wallets; wallets <= 25; ++wallets){
    console.log("wallet : ", wallets);
    if(wallets == 5){
      console.log("minting 5M tokens...")
      mint_cpv(mint, payer, program, metadata, supply)
    }
  }
}


//500K unique wallets holding tokens
function milestone_6(mint , payer , program , metadata , supply){
  let wallets = 0;
  for (wallets; wallets <= 5; ++wallets){
    console.log("wallet : ", wallets);
    if(wallets == 5){
      console.log("minting 5M tokens...")
      mint_cpv(mint, payer, program, metadata, supply)
    }
  }
}

//1M unique wallets holding
function milestone_7(mint , payer , program , metadata , supply){
  let wallets = 0;
  for (wallets; wallets <= 10; ++wallets){
    console.log("wallet : ", wallets);
    if(wallets == 5){
      console.log("minting 5M tokens...")
      mint_cpv(mint, payer, program, metadata, supply)
    }
  }
}

//platform self sustaining revenue
function milestone_8(mint , payer , program , metadata , supply){
  let operational_costs = 100;
  let revenue = 200;
  if(operational_costs < revenue){
    console.log("platform reached self-sustaining revenue!")
    mint_cpv(mint, payer, program, metadata, supply)
  }
  
}

describe("Challenge Flow", () => {
  // Set up the provider to use local validator
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Coinpetitive as Program<Coinpetitive>;

  // Ensure we're using local connection
  before(async () => {
    // Wait for validator to be ready
    await connection.getVersion();
    console.log("Local validator is ready");
  });

  async function airdropSol(connection: Connection, address: PublicKey, amount: number) {
    const signature = await connection.requestAirdrop(
      address,
      amount * web3.LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
  }

  // First, add this constant at the top of your test file after other imports
  const PROGRAM_ACCOUNT = new web3.PublicKey("wa7YMAsw23DkXEhV2F5Lqs6w7aHhNdeWB1cUFVMXeRr");

  it("complete challenge flow with submissions and voting", async () => {
    // Generate keypairs for all participants
    const creator = web3.Keypair.generate();
    const participant1 = web3.Keypair.generate();
    const participant2 = web3.Keypair.generate();
    const voter1 = web3.Keypair.generate();
    const voter2 = web3.Keypair.generate();
    const challengeKeypair = web3.Keypair.generate();

    // Log generated accounts
    console.log("\n=== Generated Accounts ===");
    console.log("Creator:", creator.publicKey.toString());
    console.log("Participant 1:", participant1.publicKey.toString());
    console.log("Participant 2:", participant2.publicKey.toString());
    console.log("Challenge:", challengeKeypair.publicKey.toString());
    console.log("===========================\n");

    // Fund accounts
    await airdropSol(connection, creator.publicKey, 5); // Increased from 2
    await airdropSol(connection, participant1.publicKey, 2); // Increased from 1
    await airdropSol(connection, participant2.publicKey, 2); // Increased from 1
    await airdropSol(connection, voter1.publicKey, 1); // Increased from 0.1
    await airdropSol(connection, voter2.publicKey, 1); // Increased from 0.1

    try {
      // 1. Create challenge
      console.log("Creating challenge...");
      const reward = new BN(1 * web3.LAMPORTS_PER_SOL);
      const registrationFee = new BN(0.1 * web3.LAMPORTS_PER_SOL);
      const submissionFee = new BN(0.2 * web3.LAMPORTS_PER_SOL);
      const votingFee = new BN(0.05 * web3.LAMPORTS_PER_SOL);

      const createTx = await program.methods
      .createChallenge(
        reward,            // reward amount
        registrationFee,   // registration fee
        submissionFee,     // submission fee
        votingFee         // voting fee
      )
      .accounts({
        user: creator.publicKey,
        challenge: challengeKeypair.publicKey,
        programAccount: PROGRAM_ACCOUNT, // Add this line
      })
      .signers([creator, challengeKeypair])
      .rpc();

      console.log(`Challenge created: ${createTx}`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Participants join challenge
      console.log("\nParticipants joining challenge...");
      const join1Tx = await program.methods
        .joinChallenge()
        .accounts({
          user: participant1.publicKey,
          challenge: challengeKeypair.publicKey,

        })
        .signers([participant1])
        .rpc();

      const join2Tx = await program.methods
        .joinChallenge()
        .accounts({
          user: participant2.publicKey,
          challenge: challengeKeypair.publicKey,

        })
        .signers([participant2])
        .rpc();

      console.log(`Participants joined: ${join1Tx}, ${join2Tx}`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Submit videos
      console.log("\nSubmitting videos...");
      const video1Url = "https://example.com/video1";
      const video2Url = "https://example.com/video2";

      const submit1Tx = await program.methods
        .submitVideo(video1Url)
        .accounts({
          participant: participant1.publicKey,
          challenge: challengeKeypair.publicKey,
        })
        .signers([participant1])
        .rpc();

      console.log("First submission complete");

      const submit2Tx = await program.methods
        .submitVideo(video2Url)
        .accounts({
          participant: participant2.publicKey,
          challenge: challengeKeypair.publicKey,

        })
        .signers([participant2])
        .rpc();

      console.log("Second submission complete");

      // Add verification after submissions
      const afterSubmissions = await program.account.challenge.fetch(
        challengeKeypair.publicKey
      );
      assert.equal(
        afterSubmissions.videoSubmissions.length, 
        2, 
        "Should have exactly 2 submissions"
      );

      // 4. Vote for videos
      console.log("\nVoting for submissions...");
      const vote1Tx = await program.methods
        .voteForVideo(new anchor.BN(0))  // Vote for first submission (index 0)
        .accounts({
          voter: voter1.publicKey,
          challenge: challengeKeypair.publicKey,
        })
        .signers([voter1])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 2000)); // Add delay between votes

      const vote2Tx = await program.methods
        .voteForVideo(new anchor.BN(0))  // Vote for first submission (index 0)
        .accounts({
          voter: voter2.publicKey,
          challenge: challengeKeypair.publicKey,
        })
        .signers([voter2])
        .rpc();

      console.log(`Votes cast: ${vote1Tx}, ${vote2Tx}`);

      // Verify votes were counted
      const afterVoting = await program.account.challenge.fetch(
        challengeKeypair.publicKey
      );

      // Log vote state for debugging
      console.log("\nVote state:", {
        submission0Votes: afterVoting.videoSubmissions[0].voteCount.toNumber(),
        submission1Votes: afterVoting.videoSubmissions[1].voteCount.toNumber(),
        totalVotes: afterVoting.totalVotes?.toNumber() || 0,
        voters: afterVoting.videoSubmissions[0].voters.map(v => v.toString())
      });

      // 5. Verify final state
      const challengeAccount = await program.account.challenge.fetch(
        challengeKeypair.publicKey
      );

      // Add verification assertions
      assert.equal(
        challengeAccount.videoSubmissions.length, 
        2, 
        "Should have 2 video submissions"
      );
      assert.equal(
        challengeAccount.videoSubmissions[0].voteCount.toNumber(), 
        2, 
        "First video should have 2 votes"
      );
      assert.equal(
        challengeAccount.videoSubmissions[1].voteCount.toNumber(), 
        0, 
        "Second video should have 0 votes"
      );


      if (!challengeAccount) {
        throw new Error("Challenge account not initialized");
      }


      assert.equal(challengeAccount.videoSubmissions.length, 2, "Should have 2 video submissions");
      assert.equal(challengeAccount.videoSubmissions[0].voteCount.toNumber(), 2, "First video should have 2 votes");
      assert.equal(challengeAccount.videoSubmissions[1].voteCount.toNumber(), 0, "Second video should have 0 votes");
      assert.equal(challengeAccount.winner.toString(), participant1.publicKey.toString(), "Winner should be participant1");
      assert.equal(challengeAccount.isActive, false, "Challenge should be completed");

      console.log("\nChallenge flow completed successfully!");

    } catch (error) {
      console.error("Challenge flow failed:", error);
      throw error;
    }
  });
});