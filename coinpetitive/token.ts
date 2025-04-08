import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import { Coinpetitive } from "../target/types/coinpetitive";
import { ComputeBudgetProgram, Connection, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import * as fs from 'fs';
import * as winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'coinpetitive-token-ops.log' })
  ]
});

// Destinations for token transfers
const DESTINATIONS = {
  founder: new PublicKey("FuFzoMF5xTwZego84fRoscnart4dPYNkpHho2UBe7NDt"),
  dev: new PublicKey("DhCu49epRCawP9Yp2ZoatzSvfmTewi2x73xEM6Vb2kh2"),
  marketing: new PublicKey("973DKZUVJQqo11pXs74KzB1jwjrMMXLueBBiRCwi9Eh")
};

// Token metadata configuration
const TOKEN_METADATA = {
  name: "Coinpetitive",
  symbol: "CPT",
  uri: "https://gateway.pinata.cloud/ipfs/bafkreier252mzmzb5jdmhbiubo6bndnpplnlvh7ynuixargdmrxi4ci2ay",
  decimals: 7
};

// Token service class that handles initialization, minting, and transfers
export class TokenService {
  private program: Program<Coinpetitive>;
  private connection: Connection;
  private mintAddress: PublicKey;
  private payer: PublicKey;
  private metadataAddress: PublicKey;
  private token_metadata_program_id: PublicKey;
  private isMainnet: boolean;
  
  constructor(program: Program<Coinpetitive>, mintAddress: PublicKey) {
    this.program = program;
    this.connection = program.provider.connection;
    this.payer = program.provider.publicKey;
    this.mintAddress = mintAddress;
    this.isMainnet = process.env.ENVIRONMENT === 'mainnet';
    
    // Token metadata program ID (from Metaplex)
    this.token_metadata_program_id = new PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );
    
    // Derive metadata address PDA
    this.metadataAddress = PublicKey.findProgramAddressSync([
      Buffer.from("metadata"),
      this.token_metadata_program_id.toBuffer(),
      this.mintAddress.toBuffer()
    ],
    this.token_metadata_program_id
    )[0];
  }
  
  /**
   * Initialize token
   */
  public async initToken(): Promise<void> {
    logger.info("Initializing token...");
    
    try {
      const info = await this.connection.getAccountInfo(this.mintAddress);
      if (info) {
        logger.info("Token already initialized");
        return;
      }
      
      logger.info("Mint not found. Initializing token...");
      
      const context = {
        metadata: this.metadataAddress,
        mint: this.mintAddress,
        payer: this.payer,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenMetadataProgram: this.token_metadata_program_id,
      };
      
      const txHash = await this.program.methods
        .initToken(TOKEN_METADATA)
        .accounts(context)
        .rpc();
      
      const explorerLink = this.isMainnet 
        ? `https://explorer.solana.com/tx/${txHash}`
        : `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
      
      logger.info(`Token initialization successful! TX: ${explorerLink}`);
      
      // Verify mint was initialized
      const newInfo = await this.connection.getAccountInfo(this.mintAddress);
      if (newInfo) {
        logger.info("Mint successfully initialized");
      } else {
        logger.error("Failed to initialize mint");
      }
    } catch (error) {
      logger.error("Error initializing token:", error);
      throw error;
    }
  }
  
  /**
   * Mint initial supply of tokens
   */
  public async mintTokens(supply: number): Promise<void> {
    logger.info(`Minting ${supply} tokens to address: ${this.mintAddress.toString()}`);
    
    try {
      const destination = await anchor.utils.token.associatedAddress({
        mint: this.mintAddress,
        owner: this.payer,
      });
      
      let initialBalance = 0;
      try {
        const balance = await this.connection.getTokenAccountBalance(destination);
        initialBalance = balance.value.uiAmount || 0;
        logger.info(`Initial balance: ${initialBalance}`);
      } catch (e) {
        logger.info("No initial balance found");
      }
      
      const context = {
        mint: this.mintAddress,
        destination,
        payer: this.payer,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      };
      
      const amount = new anchor.BN(supply * Math.pow(10, TOKEN_METADATA.decimals));
      
      logger.info(`Minting ${supply} tokens to ${this.payer.toString()}`);
      
      const txHash = await this.program.methods
        .mintToken(amount)
        .accounts(context)
        .rpc();
      
      const explorerLink = this.isMainnet 
        ? `https://explorer.solana.com/tx/${txHash}`
        : `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
      
      logger.info(`Token minting successful! TX: ${explorerLink}`);
      
      // Verify new balance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const postBalance = (await this.connection.getTokenAccountBalance(destination)).value.uiAmount || 0;
      logger.info(`Final balance: ${postBalance}`);
      
      if (postBalance !== initialBalance + supply) {
        logger.warn(`Balance check failed. Expected ${initialBalance + supply}, got ${postBalance}`);
      }
    } catch (error) {
      logger.error("Error minting tokens:", error);
      throw error;
    }
  }
  
  /**
   * Transfer tokens to founder
   */
  public async transferToFounder(amount: number): Promise<void> {
    logger.info(`Transferring ${amount} tokens to founder`);
    
    try {
      const founderWallet = DESTINATIONS.founder;
      const senderTokenAccount = getAssociatedTokenAddressSync(this.mintAddress, this.payer);
      const recipientAta = getAssociatedTokenAddressSync(this.mintAddress, founderWallet);
      
      // First check if recipient ATA exists, create if needed
      try {
        const accountInfo = await this.connection.getAccountInfo(recipientAta);
        if (!accountInfo) {
          logger.info("Founder's ATA does not exist. Creating ATA...");
          const createAtaIx = createAssociatedTokenAccountInstruction(
            this.payer,
            recipientAta,
            founderWallet,
            this.mintAddress
          );
          const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
          await this.program.provider.sendAndConfirm(createAtaTx);
          logger.info("Created founder's associated token account");
        } else {
          logger.info("Found existing ATA for founder");
        }
      } catch (e) {
        logger.error("Error checking founder ATA; attempting to create:", e);
        const createAtaIx = createAssociatedTokenAccountInstruction(
          this.payer,
          recipientAta,
          founderWallet,
          this.mintAddress
        );
        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
        await this.program.provider.sendAndConfirm(createAtaTx);
      }
      
      // Transfer tokens
      const tokenAmount = new anchor.BN(amount * Math.pow(10, TOKEN_METADATA.decimals));
      
      const txSignature = await this.program.methods
        .transferFounder(tokenAmount)
        .accounts({
          from: senderTokenAccount,
          to: recipientAta,
          authority: this.payer,
          tokenProgram: TOKEN_PROGRAM_ID
        } as any)
        .rpc();
      
      const explorerLink = this.isMainnet 
        ? `https://explorer.solana.com/tx/${txSignature}`
        : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
      
      logger.info(`Transfer to founder successful! TX: ${explorerLink}`);
    } catch (error) {
      logger.error("Error transferring to founder:", error);
      throw error;
    }
  }
  
  /**
   * Transfer tokens to dev team
   */
  public async transferToDev(amount: number): Promise<void> {
    logger.info(`Transferring ${amount} tokens to dev team`);
    
    try {
      const devWallet = DESTINATIONS.dev;
      const senderTokenAccount = getAssociatedTokenAddressSync(this.mintAddress, this.payer);
      const recipientAta = getAssociatedTokenAddressSync(this.mintAddress, devWallet);
      
      // First check if recipient ATA exists, create if needed
      try {
        const accountInfo = await this.connection.getAccountInfo(recipientAta);
        if (!accountInfo) {
          logger.info("Dev team's ATA does not exist. Creating ATA...");
          const createAtaIx = createAssociatedTokenAccountInstruction(
            this.payer,
            recipientAta,
            devWallet,
            this.mintAddress
          );
          const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
          await this.program.provider.sendAndConfirm(createAtaTx);
          logger.info("Created dev team's associated token account");
        } else {
          logger.info("Found existing ATA for dev team");
        }
      } catch (e) {
        logger.error("Error checking dev team ATA; attempting to create:", e);
        const createAtaIx = createAssociatedTokenAccountInstruction(
          this.payer,
          recipientAta,
          devWallet,
          this.mintAddress
        );
        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
        await this.program.provider.sendAndConfirm(createAtaTx);
      }
      
      // Transfer tokens
      const tokenAmount = new anchor.BN(amount * Math.pow(10, TOKEN_METADATA.decimals));
      
      const txSignature = await this.program.methods
        .transferDev(tokenAmount)
        .accounts({
          from: senderTokenAccount,
          to: recipientAta,
          authority: this.payer,
          tokenProgram: TOKEN_PROGRAM_ID
        } as any)
        .rpc();
      
      const explorerLink = this.isMainnet 
        ? `https://explorer.solana.com/tx/${txSignature}`
        : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
      
      logger.info(`Transfer to dev team successful! TX: ${explorerLink}`);
    } catch (error) {
      logger.error("Error transferring to dev team:", error);
      throw error;
    }
  }
  
  /**
   * Transfer tokens to marketing team
   */
  public async transferToMarketing(amount: number): Promise<void> {
    logger.info(`Transferring ${amount} tokens to marketing team`);
    
    try {
      // Set up compute budget instruction for larger TX
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({ 
        units: 600000
      });
      
      const marketingWallet = DESTINATIONS.marketing;
      const senderTokenAccount = getAssociatedTokenAddressSync(this.mintAddress, this.payer);
      const recipientAta = getAssociatedTokenAddressSync(this.mintAddress, marketingWallet);
      
      // First check if recipient ATA exists, create if needed
      try {
        const accountInfo = await this.connection.getAccountInfo(recipientAta);
        if (!accountInfo) {
          logger.info("Marketing team's ATA does not exist. Creating ATA...");
          const createAtaIx = createAssociatedTokenAccountInstruction(
            this.payer,
            recipientAta,
            marketingWallet,
            this.mintAddress
          );
          const createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
          await this.program.provider.sendAndConfirm(createAtaTx);
          logger.info("Created marketing team's associated token account");
        } else {
          logger.info("Found existing ATA for marketing team");
        }
      } catch (e) {
        logger.error("Error checking marketing team ATA; attempting to create:", e);
        const createAtaIx = createAssociatedTokenAccountInstruction(
          this.payer,
          recipientAta,
          marketingWallet,
          this.mintAddress
        );
        const createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
        await this.program.provider.sendAndConfirm(createAtaTx);
      }
      
      // Transfer tokens
      const tokenAmount = new anchor.BN(amount * Math.pow(10, TOKEN_METADATA.decimals));
      
      const txSignature = await this.program.methods
        .marketingTransfer(tokenAmount)
        .accounts({
          from: senderTokenAccount,
          to: recipientAta,
          authority: this.payer,
          tokenProgram: TOKEN_PROGRAM_ID
        } as any)
        .preInstructions([modifyComputeUnits])
        .rpc();
      
      const explorerLink = this.isMainnet 
        ? `https://explorer.solana.com/tx/${txSignature}`
        : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
      
      logger.info(`Transfer to marketing team successful! TX: ${explorerLink}`);
    } catch (error) {
      logger.error("Error transferring to marketing team:", error);
      throw error;
    }
  }
  
  // Setup provider helper (moved from main class)
  public static setupProvider(rpcUrl?: string): anchor.AnchorProvider {
    const connection = new Connection(
      rpcUrl || process.env.RPC_URL || "https://api.devnet.solana.com", 
      "confirmed"
    );
    
    // Use keypair from env or local file
    let keypair: anchor.web3.Keypair;
    if (process.env.PRIVATE_KEY) {
      const secretKey = Buffer.from(JSON.parse(process.env.PRIVATE_KEY));
      keypair = anchor.web3.Keypair.fromSecretKey(secretKey);
    } else {
      try {
        const keypairFile = JSON.parse(
          fs.readFileSync(process.env.KEYPAIR_FILE || `${process.env.HOME}/.config/solana/id.json`, "utf-8")
        );
        keypair = anchor.web3.Keypair.fromSecretKey(
          Uint8Array.from(keypairFile)
        );
      } catch (e) {
        logger.error("Failed to load keypair:", e);
        throw new Error("No keypair found. Please provide PRIVATE_KEY env var or a KEYPAIR_FILE");
      }
    }
    
    return new anchor.AnchorProvider(
      connection,
      new anchor.Wallet(keypair),
      { commitment: "confirmed" }
    );
  }
  
  // Factory method to create token service
  public static create(programId?: string, rpcUrl?: string): TokenService {
    const provider = this.setupProvider(rpcUrl);
    
    // First correctly initialize the program
    const programPubkey = new PublicKey(programId || "H7SvZyDYbZ7ioeCTYWE4wuVdgWUyA5XJ1CAZnsH7ga8E");
    const program = new anchor.Program(
      require("../target/idl/coinpetitive.json") as unknown as Idl,
      provider
    ) as unknown as Program<Coinpetitive>;
    
    // Now derive the mint address as a PDA
    const [mintAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );
    
    logger.info(`Using derived mint address: ${mintAddress.toString()}`);
    
    return new TokenService(program, mintAddress);
  }
}

// Example usage
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!command) {
      console.log("Please provide a command: init-token, mint, transfer-founder, transfer-dev, transfer-marketing");
      process.exit(1);
    }
    
    // Create token service
    const tokenService = TokenService.create();
    
    switch (command) {
      case 'init-token':
        await tokenService.initToken();
        break;
      case 'mint':
        const mintAmount = args[1] ? parseInt(args[1]) : 21_000_000;
        await tokenService.mintTokens(mintAmount);
        break;
      case 'transfer-founder':
        const founderAmount = args[1] ? parseInt(args[1]) : 1_100_000;
        await tokenService.transferToFounder(founderAmount);
        break;
      case 'transfer-dev':
        const devAmount = args[1] ? parseInt(args[1]) : 500_000;
        await tokenService.transferToDev(devAmount);
        break;
      case 'transfer-marketing':
        const marketingAmount = args[1] ? parseInt(args[1]) : 500_000;
        await tokenService.transferToMarketing(marketingAmount);
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.log("Available commands: init-token, mint, transfer-founder, transfer-dev, transfer-marketing");
        process.exit(1);
    }
    
    logger.info(`Successfully executed ${command}`);
  } catch (error) {
    logger.error("Error executing command:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => process.exit(0));
}

export default TokenService;