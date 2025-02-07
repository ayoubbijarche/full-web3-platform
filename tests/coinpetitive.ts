import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Coinpetitive } from "../target/types/coinpetitive";
import { web3 } from "@coral-xyz/anchor";
import BN = require("@coral-xyz/anchor");
import { assert } from "chai";
import { ComputeBudgetProgram } from "@solana/web3.js";

describe("coinpetitive", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Coinpetitive as Program<Coinpetitive>;
  
  const metadata_seed = "metadata"
  const token_metadata_program_id = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  )
  
  const mint_seed = "mint";
  const payer = program.provider.publicKey;
  const metadata = {
    name : "Coinpetitive",
    symbol : "CPV",
    uri : "https://gateway.pinata.cloud/ipfs/bafkreideacsn42daznmw6tixpzqeaiqwkchmntu7luiqieaujancknrr7y",
    decimals : 7
  }
  
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
    units: 3000000  // Double the default
  });
  
  const supply = 21;
  const [mint] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from(mint_seed)], 
    program.programId
  );
  
  const [metadataAddress] = web3.PublicKey
    .findProgramAddressSync([
      Buffer.from("metadata"),
      token_metadata_program_id.toBuffer(),
      mint.toBuffer()
    ], 
    token_metadata_program_id
  );
  

  it("Initialize", async () => {
    const info = await program.provider.connection.getAccountInfo(mint);
    if (info) {
      return; // Do not attempt to initialize if already initialized
    }
    console.log("  Mint not found. Initializing Program...");
  
    const context = {
      metadata: metadataAddress,
      mint,
      payer,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
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
  
  
  it("mint tokens", async () => {
      const destination = await anchor.utils.token.associatedAddress({
        mint: mint,
        owner: payer,
      });

      // Check existing balance
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
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      };
  
      // Mint exactly 2 tokens with proper decimal handling
      const amountToMint = 1000000;
      const amount = new anchor.BN(amountToMint * Math.pow(10, metadata.decimals));
      
      const txHash = await program.methods
        .mintToken(amount)
        .accounts(context)
        .rpc();
      await program.provider.connection.confirmTransaction(txHash);
      console.log(`  https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
  
      // Wait a bit for the transaction to be fully processed
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
})
