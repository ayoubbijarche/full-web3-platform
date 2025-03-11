import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from "@solana/web3.js";
import { Coinpetitive } from "../target/types/coinpetitive"; // Your program's TypeScript types

module.exports = async function (provider: anchor.Provider) {
  // Configure client to use the provider
  anchor.setProvider(provider);

  // Get program ID from your deployed program
  const programId = new anchor.web3.PublicKey("9ZVc4bXMx6KDkJLVzQsk6pxqMe5BtGqg8NPkJXpxfY5r");
  
  // Create program interface
  const program = new Program<Coinpetitive>(
    require("../target/idl/coinpetitive.json"),
    provider
  );

  try {
    // Initialize program state if needed
    const stateAccount = Keypair.generate();
    
    console.log("Deploying program state...");
    console.log("Program ID:", programId.toString());
    console.log("Provider Wallet:", provider.publicKey.toString());

    // Add any initialization transactions here
    // For example:
    // await program.methods
    //   .initialize()
    //   .accounts({
    //     state: stateAccount.publicKey,
    //     authority: provider.wallet.publicKey,
    //     systemProgram: SystemProgram.programId,
    //   })
    //   .signers([stateAccount])
    //   .rpc();

    console.log("Deployment successful!");
    console.log("State Account:", stateAccount.publicKey.toString());

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
};
