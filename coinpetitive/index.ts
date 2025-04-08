import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import { Coinpetitive } from "../target/types/coinpetitive";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from 'fs';
import * as winston from 'winston';

// ======== Configuration ========
const CONFIG = {
  mainnet: process.env.ENVIRONMENT === 'mainnet',
  logLevel: process.env.LOG_LEVEL || 'info',
  rpcUrl: process.env.RPC_URL || (process.env.ENVIRONMENT === 'mainnet' 
    ? 'https://api.mainnet-beta.solana.com' 
    : 'https://api.devnet.solana.com'),
  tokenAddress: process.env.TOKEN_ADDRESS || 'EHuWgt2z53Krd5f7WPrnBbtupa6s5o59iMBBcq9SuVE',
  checkIntervalSeconds: parseInt(process.env.CHECK_INTERVAL_SECONDS || '30'),
  errorRetryBaseSeconds: 10,
  maxRetrySeconds: 300,
  tokenDecimals: 7,
  
  milestones: {
    challenges: [
      { threshold: 5_000_000, index: 0, name: "5M challenges completed" },
      { threshold: 10_000_000, index: 1, name: "10M challenges completed" }
    ],
    entryFees: [
      { threshold: 50_000_000, index: 2, name: "50M total entry fees" },
      { threshold: 100_000_000, index: 3, name: "100M total entry fees" }
    ],
    wallets: [
      { threshold: 250_000, index: 4, name: "250K unique wallets" },
      { threshold: 500_000, index: 5, name: "500K unique wallets" },
      { threshold: 1_000_000, index: 6, name: "1M unique wallets" }
    ]
  }
};

// ======== Setup Logger ========
const logger = winston.createLogger({
  level: CONFIG.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'coinpetitive-monitor.log' })
  ]
});

// ======== Helper Functions ========
function formatTokenAmount(amount: number): string {
  return (amount / Math.pow(10, CONFIG.tokenDecimals)).toFixed(2);
}

async function exponentialBackoff(attempt: number): Promise<void> {
  const delay = Math.min(
    Math.pow(2, attempt) * CONFIG.errorRetryBaseSeconds * 1000,
    CONFIG.maxRetrySeconds * 1000
  );
  logger.debug(`Retry backoff: ${delay}ms (attempt ${attempt})`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

// ======== Coinpetitive Service Class ========
export class CoinpetitiveService {
  private program: Program<Coinpetitive>;
  private connection: Connection;
  private tokenStateAddress: PublicKey;
  private challengeTrackerPda: PublicKey;
  private feeTrackerPda: PublicKey;
  private mintAddress: PublicKey;
  private payer: PublicKey;
  private lastProcessedState: {
    challengeCount: number;
    feeAmount: number;
    walletCount: number;
    processedMilestones: Set<number>;
  };
  private running: boolean = false;
  
  constructor() {
    const provider = this.setupProvider();
    this.program = new Program(
        require("../target/idl/coinpetitive.json") as unknown as Idl,
        provider
    ) as unknown as Program<Coinpetitive>;
    
    this.connection = provider.connection;
    this.payer = provider.publicKey;
    this.mintAddress = new PublicKey(CONFIG.tokenAddress);
    
    // Initialize important PDAs
    this.tokenStateAddress = PublicKey.findProgramAddressSync(
      [Buffer.from("token_state")],
      this.program.programId
    )[0];
    
    this.challengeTrackerPda = PublicKey.findProgramAddressSync(
      [Buffer.from("challenge_tracker")],
      this.program.programId
    )[0];
    
    this.feeTrackerPda = PublicKey.findProgramAddressSync(
      [Buffer.from("fee_tracker")],
      this.program.programId
    )[0];
    
    this.lastProcessedState = {
      challengeCount: 0,
      feeAmount: 0,
      walletCount: 0,
      processedMilestones: new Set()
    };
    
    // Try to load saved state from disk
    this.loadState();
  }
  
  private setupProvider(): anchor.AnchorProvider {
    const connection = new Connection(CONFIG.rpcUrl, "confirmed");
    
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
  
  // ---- State persistence functions ----
  private saveState(): void {
    try {
      const state = {
        challengeCount: this.lastProcessedState.challengeCount,
        feeAmount: this.lastProcessedState.feeAmount,
        walletCount: this.lastProcessedState.walletCount,
        processedMilestones: Array.from(this.lastProcessedState.processedMilestones)
      };
      
      fs.writeFileSync(
        "coinpetitive-monitor-state.json",
        JSON.stringify(state, null, 2)
      );
      logger.debug("Saved monitoring state to disk");
    } catch (e) {
      logger.warn("Failed to save state:", e);
    }
  }
  
  private loadState(): void {
    try {
      if (fs.existsSync("coinpetitive-monitor-state.json")) {
        const state = JSON.parse(
          fs.readFileSync("coinpetitive-monitor-state.json", "utf-8")
        );
        
        this.lastProcessedState = {
          challengeCount: state.challengeCount || 0,
          feeAmount: state.feeAmount || 0,
          walletCount: state.walletCount || 0,
          processedMilestones: new Set(state.processedMilestones || [])
        };
        
        logger.info("Loaded previous monitoring state");
        logger.info(`Last processed: ${this.lastProcessedState.challengeCount} challenges, ${formatTokenAmount(this.lastProcessedState.feeAmount)} fees, ${this.lastProcessedState.walletCount} wallets`);
      }
    } catch (e) {
      logger.warn("Failed to load state:", e);
    }
  }
  
  /**
   * Core function to mint tokens when a milestone is reached
   */
  private async mintForMilestone(milestone: { threshold: number, index: number, name: string }): Promise<boolean> {
    logger.info(`🎯 Starting mint for milestone: ${milestone.name}`);
    
    try {
      // Check if already processed locally
      if (this.lastProcessedState.processedMilestones.has(milestone.index)) {
        logger.info(`Milestone ${milestone.name} already processed locally`);
        return false;
      }
      
      // Verify token state and check if milestone already used
      const tokenState = await this.program.account.tokenState.fetch(this.tokenStateAddress);
      if (tokenState.mintConditionsUsed[milestone.index]) {
        logger.info(`Milestone ${milestone.name} already used on-chain`);
        
        // Update our local state to match chain
        this.lastProcessedState.processedMilestones.add(milestone.index);
        this.saveState();
        return false;
      }
      
      // Check time restriction (1 year between mints)
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const lastMintTimestamp = tokenState.lastMintTimestamp.toNumber();
      const MIN_TIME_BETWEEN_MINTS = 365 * 24 * 60 * 60; // 1 year in seconds
      
      if (currentTimestamp - lastMintTimestamp < MIN_TIME_BETWEEN_MINTS) {
        const daysRemaining = Math.ceil((MIN_TIME_BETWEEN_MINTS - (currentTimestamp - lastMintTimestamp)) / (24 * 60 * 60));
        logger.info(`Time restriction applies: ${daysRemaining} days remaining before minting allowed`);
        return false;
      }
      
      // Proceed with minting
      logger.info(`💰 Minting 5M tokens for milestone: ${milestone.name}`);
      
      // Get destination for minted tokens
      const destination = await anchor.utils.token.associatedAddress({
        mint: this.mintAddress,
        owner: this.payer,
      });
      
      // Mint 5M tokens
      const mintAmount = new anchor.BN(5_000_000 * Math.pow(10, CONFIG.tokenDecimals));
      
      const txHash = await this.program.methods
        .mintToken(mintAmount)
        .accounts({
          payer: this.payer,
        })
        .rpc();
      
      const explorerLink = CONFIG.mainnet 
        ? `https://explorer.solana.com/tx/${txHash}`
        : `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
      
      logger.info(`✅ Milestone mint successful! TX: ${explorerLink}`);
      
      // Mark as processed locally
      this.lastProcessedState.processedMilestones.add(milestone.index);
      this.saveState();
      
      // Verify the milestone was correctly marked on-chain
      await new Promise(resolve => setTimeout(resolve, 5000));
      const updatedTokenState = await this.program.account.tokenState.fetch(this.tokenStateAddress);
      if (!updatedTokenState.mintConditionsUsed[milestone.index]) {
        logger.warn(`Warning: Mint transaction confirmed but milestone ${milestone.index} not marked as used in token state`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error minting tokens for milestone ${milestone.name}:`, error);
      return false;
    }
  }
  
  /**
   * Initialize challenge tracker account if it doesn't exist
   */
  private async initializeChallengeTrackerIfNeeded(): Promise<void> {
    try {
      const trackerAccount = await this.connection.getAccountInfo(this.challengeTrackerPda);
      if (!trackerAccount) {
        logger.info("Challenge tracker account doesn't exist. Initializing...");
        await this.program.methods
          .initializeChallengeTracker()
          .accounts({
            authority: this.payer,
          })
          .rpc();
        logger.info("Challenge tracker initialized successfully!");
      }
    } catch (error) {
      logger.error("Error checking/initializing challenge tracker:", error);
      throw error;
    }
  }
  
  /**
   * Initialize fee tracker account if it doesn't exist
   */
  private async initializeFeeTrackerIfNeeded(): Promise<void> {
    try {
      const feeTrackerAccount = await this.connection.getAccountInfo(this.feeTrackerPda);
      if (!feeTrackerAccount) {
        logger.info("Fee tracker account doesn't exist. Initializing...");
        await this.program.methods
          .initializeFeeTracker()
          .accounts({
            authority: this.payer,
          })
          .rpc();
        logger.info("Fee tracker initialized successfully!");
      }
    } catch (error) {
      logger.error("Error checking/initializing fee tracker:", error);
      throw error;
    }
  }
  
  /**
   * Monitor challenge completions for milestones
   */
  public async monitorChallengeCompletions(): Promise<void> {
    if (!this.running) return;
    
    logger.info("Checking challenge completion milestones");
    let retryAttempt = 0;
    
    try {
      // Initialize tracker if needed
      await this.initializeChallengeTrackerIfNeeded();
      
      // Fetch current state
      const tracker = await this.program.account.challengeTracker.fetch(this.challengeTrackerPda);
      const currentChallengeCount = tracker.totalChallenges.toNumber();
      
      // Check if anything changed
      if (currentChallengeCount !== this.lastProcessedState.challengeCount) {
        logger.info(`Challenge count changed: ${this.lastProcessedState.challengeCount} -> ${currentChallengeCount}`);
        
        // Check each milestone
        for (const milestone of CONFIG.milestones.challenges) {
          if (currentChallengeCount >= milestone.threshold && 
              !this.lastProcessedState.processedMilestones.has(milestone.index)) {
            
            logger.info(`🎉 Challenge milestone reached: ${milestone.name}`);
            await this.mintForMilestone(milestone);
            
            // Only process one milestone at a time
            break;
          }
        }
        
        // Update state
        this.lastProcessedState.challengeCount = currentChallengeCount;
        this.saveState();
      }
      
      // Reset retry count on success
      retryAttempt = 0;
    } catch (error) {
      logger.error("Error in challenge monitoring:", error);
      await exponentialBackoff(retryAttempt++);
    }
  }
  
  /**
   * Monitor participation fees for milestones
   */
  public async monitorParticipationFees(): Promise<void> {
    if (!this.running) return;
    
    logger.info("Checking participation fee milestones");
    let retryAttempt = 0;
    
    try {
      // Initialize tracker if needed
      await this.initializeFeeTrackerIfNeeded();
      
      // Fetch current state
      const feeTracker = await this.program.account.feeTracker.fetch(this.feeTrackerPda);
      const currentRawFees = feeTracker.totalParticipationFees.toNumber();
      
      // Check if anything changed
      if (currentRawFees !== this.lastProcessedState.feeAmount) {
        logger.info(`Fee amount changed: ${formatTokenAmount(this.lastProcessedState.feeAmount)} -> ${formatTokenAmount(currentRawFees)} CPT`);
        
        // Check each milestone
        for (const milestone of CONFIG.milestones.entryFees) {
          if (currentRawFees >= milestone.threshold && 
              !this.lastProcessedState.processedMilestones.has(milestone.index)) {
            
            logger.info(`🎉 Fee milestone reached: ${milestone.name}`);
            await this.mintForMilestone(milestone);
            
            // Only process one milestone at a time
            break;
          }
        }
        
        // Update state
        this.lastProcessedState.feeAmount = currentRawFees;
        this.saveState();
      }
      
      // Reset retry count on success
      retryAttempt = 0;
    } catch (error) {
      logger.error("Error in fee monitoring:", error);
      await exponentialBackoff(retryAttempt++);
    }
  }
  
  /**
   * Monitor wallet counts for milestones
   */
  public async monitorWalletMilestones(): Promise<void> {
    if (!this.running) return;
    
    logger.info("Checking wallet count milestones");
    let retryAttempt = 0;
    
    try {
      // Find all token accounts for this mint
      logger.debug("Scanning for wallet holders...");
      const tokenAccounts = await this.connection.getProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
          filters: [
            { dataSize: 165 }, // Token account size
            { memcmp: { offset: 0, bytes: this.mintAddress.toBase58() } }, // Filter by mint
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
      
      // Check if anything changed
      if (walletCount !== this.lastProcessedState.walletCount) {
        logger.info(`Wallet count changed: ${this.lastProcessedState.walletCount} -> ${walletCount}`);
        
        // Check each milestone
        for (const milestone of CONFIG.milestones.wallets) {
          if (walletCount >= milestone.threshold && 
              !this.lastProcessedState.processedMilestones.has(milestone.index)) {
            
            logger.info(`🎉 Wallet milestone reached: ${milestone.name}`);
            await this.mintForMilestone(milestone);
            
            // Only process one milestone at a time
            break;
          }
        }
        
        // Update state
        this.lastProcessedState.walletCount = walletCount;
        this.saveState();
      }
      
      // Reset retry count on success
      retryAttempt = 0;
    } catch (error) {
      logger.error("Error in wallet monitoring:", error);
      await exponentialBackoff(retryAttempt++);
    }
  }
  
  /**
   * Start the monitoring service
   */
  public async start(): Promise<void> {
    logger.info("Starting Coinpetitive monitoring service");
    logger.info(`Mode: ${CONFIG.mainnet ? 'MAINNET' : 'DEVNET'}`);
    logger.info(`RPC: ${CONFIG.rpcUrl}`);
    logger.info(`Token address: ${this.mintAddress.toString()}`);
    
    this.running = true;
    
    // Register signal handlers for clean shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    
    // Main monitoring loop
    while (this.running) {
      try {
        // Run all monitoring tasks sequentially
        await this.monitorChallengeCompletions();
        await this.monitorParticipationFees();
        await this.monitorWalletMilestones();
        
        logger.debug(`Completed monitoring cycle, waiting ${CONFIG.checkIntervalSeconds} seconds...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.checkIntervalSeconds * 1000));
      } catch (error) {
        logger.error("Error in monitoring cycle:", error);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on error
      }
    }
  }
  
  public shutdown(): void {
    logger.info("Shutting down service...");
    this.running = false;
    this.saveState();
    logger.info("Shutdown complete, exiting");
    process.exit(0);
  }
}

// =============== MAIN ENTRY POINT ===============
async function main() {
  try {
    const service = new CoinpetitiveService();
    await service.start();
  } catch (error) {
    logger.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if invoked directly
if (require.main === module) {
  logger.info("Coinpetitive monitoring service starting");
  main().catch(err => {
    logger.error("Unexpected error in main:", err);
    process.exit(1);
  });
}

export default CoinpetitiveService;