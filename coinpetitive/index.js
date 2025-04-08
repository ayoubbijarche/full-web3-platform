"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoinpetitiveService = void 0;
exports.main = main;
exports.runCommand = runCommand;
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const fs = __importStar(require("fs"));
const winston = __importStar(require("winston"));
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
    // Use the exact same milestone thresholds as in the test file
    milestones: {
        challenges: [
            { threshold: 5000000, index: 0, name: "5M challenges completed" },
            { threshold: 10000000, index: 1, name: "10M challenges completed" }
        ],
        entryFees: [
            { threshold: 50000000, index: 2, name: "50M total entry fees" },
            { threshold: 100000000, index: 3, name: "100M total entry fees" }
        ],
        wallets: [
            { threshold: 250000, index: 4, name: "250K unique wallets" },
            { threshold: 500000, index: 5, name: "500K unique wallets" },
            { threshold: 1000000, index: 6, name: "1M unique wallets" }
        ],
        revenue: [
            { threshold: 1, index: 7, name: "Self-sustaining revenue" } // Special case, manually triggered
        ]
    },
    // Fund transfer destinations - added from test file
    destinations: {
        founder: new web3_js_1.PublicKey("FuFzoMF5xTwZego84fRoscnart4dPYNkpHho2UBe7NDt"),
        dev: new web3_js_1.PublicKey("DhCu49epRCawP9Yp2ZoatzSvfmTewi2x73xEM6Vb2kh2"),
        marketing: new web3_js_1.PublicKey("973DKZUVJQqo11pXs74KzB1jwjrMMXLueBBiRCwi9Eh")
    },
    metadata: {
        name: "Coinpetitive",
        symbol: "CPT",
        uri: "https://gateway.pinata.cloud/ipfs/bafkreier252mzmzb5jdmhbiubo6bndnpplnlvh7ynuixargdmrxi4ci2ay",
        decimals: 7
    }
};
// ======== Setup Logger ========
const logger = winston.createLogger({
    level: CONFIG.logLevel,
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'coinpetitive-monitor.log' })
    ]
});
// ======== Helper Functions ========
function formatTokenAmount(amount, decimals = CONFIG.tokenDecimals) {
    return (amount / Math.pow(10, decimals)).toFixed(2);
}
function exponentialBackoff(attempt_1) {
    return __awaiter(this, arguments, void 0, function* (attempt, baseSeconds = CONFIG.errorRetryBaseSeconds) {
        const delay = Math.min(Math.pow(2, attempt) * baseSeconds * 1000, CONFIG.maxRetrySeconds * 1000);
        logger.debug(`Retry backoff: ${delay}ms (attempt ${attempt})`);
        yield new Promise(resolve => setTimeout(resolve, delay));
    });
}
// ======== Coinpetitive Service Class ========
class CoinpetitiveService {
    constructor() {
        this.running = false;
        const provider = this.setupProvider();
        this.program = new anchor_1.Program(require("../target/idl/coinpetitive.json"), provider);
        this.connection = provider.connection;
        this.payer = provider.publicKey;
        this.mintAddress = new web3_js_1.PublicKey(CONFIG.tokenAddress);
        // Token metadata program ID (from Metaplex)
        this.token_metadata_program_id = new web3_js_1.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
        // Initialize important PDAs
        this.tokenStateAddress = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("token_state")], this.program.programId)[0];
        this.challengeTrackerPda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("challenge_tracker")], this.program.programId)[0];
        this.feeTrackerPda = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("fee_tracker")], this.program.programId)[0];
        // Metadata address PDA - using same calculation as test code
        this.metadataAddress = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from("metadata"),
            this.token_metadata_program_id.toBuffer(),
            this.mintAddress.toBuffer()
        ], this.token_metadata_program_id)[0];
        this.lastProcessedState = {
            challengeCount: 0,
            feeAmount: 0,
            walletCount: 0,
            processedMilestones: new Set()
        };
        // Try to load saved state from disk
        this.loadState();
    }
    setupProvider() {
        const connection = new web3_js_1.Connection(CONFIG.rpcUrl, "confirmed");
        // Use keypair from env or local file
        let keypair;
        if (process.env.PRIVATE_KEY) {
            const secretKey = Buffer.from(JSON.parse(process.env.PRIVATE_KEY));
            keypair = anchor.web3.Keypair.fromSecretKey(secretKey);
        }
        else {
            try {
                const keypairFile = JSON.parse(fs.readFileSync(process.env.KEYPAIR_FILE || `${process.env.HOME}/.config/solana/id.json`, "utf-8"));
                keypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairFile));
            }
            catch (e) {
                logger.error("Failed to load keypair:", e);
                throw new Error("No keypair found. Please provide PRIVATE_KEY env var or a KEYPAIR_FILE");
            }
        }
        return new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment: "confirmed" });
    }
    // ---- State persistence functions ----
    saveState() {
        try {
            const state = {
                challengeCount: this.lastProcessedState.challengeCount,
                feeAmount: this.lastProcessedState.feeAmount,
                walletCount: this.lastProcessedState.walletCount,
                processedMilestones: Array.from(this.lastProcessedState.processedMilestones)
            };
            fs.writeFileSync("coinpetitive-monitor-state.json", JSON.stringify(state, null, 2));
            logger.debug("Saved monitoring state to disk");
        }
        catch (e) {
            logger.warn("Failed to save state:", e);
        }
    }
    loadState() {
        try {
            if (fs.existsSync("coinpetitive-monitor-state.json")) {
                const state = JSON.parse(fs.readFileSync("coinpetitive-monitor-state.json", "utf-8"));
                this.lastProcessedState = {
                    challengeCount: state.challengeCount || 0,
                    feeAmount: state.feeAmount || 0,
                    walletCount: state.walletCount || 0,
                    processedMilestones: new Set(state.processedMilestones || [])
                };
                logger.info("Loaded previous monitoring state");
                logger.info(`Last processed: ${this.lastProcessedState.challengeCount} challenges, ${formatTokenAmount(this.lastProcessedState.feeAmount)} fees, ${this.lastProcessedState.walletCount} wallets`);
            }
        }
        catch (e) {
            logger.warn("Failed to load state:", e);
        }
    }
    // ============ Token Functions ============
    /**
     * Initialize token (adapted from test function)
     */
    initToken() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info("Initializing token...");
            try {
                const info = yield this.connection.getAccountInfo(this.mintAddress);
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
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    tokenMetadataProgram: this.token_metadata_program_id,
                };
                const txHash = yield this.program.methods
                    .initToken(CONFIG.metadata)
                    .accounts(context)
                    .rpc();
                const explorerLink = CONFIG.mainnet
                    ? `https://explorer.solana.com/tx/${txHash}`
                    : `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
                logger.info(`Token initialization successful! TX: ${explorerLink}`);
                // Verify mint was initialized
                const newInfo = yield this.connection.getAccountInfo(this.mintAddress);
                if (newInfo) {
                    logger.info("Mint successfully initialized");
                }
                else {
                    logger.error("Failed to initialize mint");
                }
            }
            catch (error) {
                logger.error("Error initializing token:", error);
                throw error;
            }
        });
    }
    /**
     * Mint tokens (adapted from test function)
     */
    mintTokens(supply) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(`Minting ${supply} tokens to address: ${this.mintAddress.toString()}`);
            try {
                const destination = yield anchor.utils.token.associatedAddress({
                    mint: this.mintAddress,
                    owner: this.payer,
                });
                let initialBalance = 0;
                try {
                    const balance = yield this.connection.getTokenAccountBalance(destination);
                    initialBalance = balance.value.uiAmount || 0;
                    logger.info(`Initial balance: ${initialBalance}`);
                }
                catch (e) {
                    logger.info("No initial balance found");
                }
                const context = {
                    mint: this.mintAddress,
                    destination,
                    payer: this.payer,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                };
                const amount = new anchor.BN(supply * Math.pow(10, CONFIG.tokenDecimals));
                logger.info(`Minting ${supply} tokens to ${this.payer.toString()}`);
                const txHash = yield this.program.methods
                    .mintToken(amount)
                    .accounts(context)
                    .rpc();
                const explorerLink = CONFIG.mainnet
                    ? `https://explorer.solana.com/tx/${txHash}`
                    : `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
                logger.info(`Token minting successful! TX: ${explorerLink}`);
                // Verify new balance
                yield new Promise(resolve => setTimeout(resolve, 2000));
                const postBalance = (yield this.connection.getTokenAccountBalance(destination)).value.uiAmount || 0;
                logger.info(`Final balance: ${postBalance}`);
                if (postBalance !== initialBalance + supply) {
                    logger.warn(`Balance check failed. Expected ${initialBalance + supply}, got ${postBalance}`);
                }
            }
            catch (error) {
                logger.error("Error minting tokens:", error);
                throw error;
            }
        });
    }
    /**
     * Transfer tokens to founder (adapted from test function)
     */
    transferToFounder(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(`Transferring ${amount} tokens to founder`);
            try {
                const founderWallet = CONFIG.destinations.founder;
                const senderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, this.payer);
                const recipientAta = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, founderWallet);
                // First check if recipient ATA exists, create if needed
                try {
                    const accountInfo = yield this.connection.getAccountInfo(recipientAta);
                    if (!accountInfo) {
                        logger.info("Founder's ATA does not exist. Creating ATA...");
                        const createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, founderWallet, this.mintAddress);
                        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                        yield this.program.provider.sendAndConfirm(createAtaTx);
                        logger.info("Created founder's associated token account");
                    }
                    else {
                        logger.info("Found existing ATA for founder");
                    }
                }
                catch (e) {
                    logger.error("Error checking founder ATA; attempting to create:", e);
                    const createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, founderWallet, this.mintAddress);
                    const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                    yield this.program.provider.sendAndConfirm(createAtaTx);
                }
                // Transfer tokens
                const tokenAmount = new anchor.BN(amount * Math.pow(10, CONFIG.tokenDecimals));
                const txSignature = yield this.program.methods
                    .transferFounder(tokenAmount)
                    .accounts({
                    from: senderTokenAccount,
                    to: recipientAta,
                    authority: this.payer,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                })
                    .rpc();
                const explorerLink = CONFIG.mainnet
                    ? `https://explorer.solana.com/tx/${txSignature}`
                    : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
                logger.info(`Transfer to founder successful! TX: ${explorerLink}`);
            }
            catch (error) {
                logger.error("Error transferring to founder:", error);
                throw error;
            }
        });
    }
    /**
     * Transfer tokens to dev team (adapted from test function)
     */
    transferToDev(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(`Transferring ${amount} tokens to dev team`);
            try {
                const devWallet = CONFIG.destinations.dev;
                const senderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, this.payer);
                const recipientAta = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, devWallet);
                // First check if recipient ATA exists, create if needed
                try {
                    const accountInfo = yield this.connection.getAccountInfo(recipientAta);
                    if (!accountInfo) {
                        logger.info("Dev team's ATA does not exist. Creating ATA...");
                        const createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, devWallet, this.mintAddress);
                        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                        yield this.program.provider.sendAndConfirm(createAtaTx);
                        logger.info("Created dev team's associated token account");
                    }
                    else {
                        logger.info("Found existing ATA for dev team");
                    }
                }
                catch (e) {
                    logger.error("Error checking dev team ATA; attempting to create:", e);
                    const createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, devWallet, this.mintAddress);
                    const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                    yield this.program.provider.sendAndConfirm(createAtaTx);
                }
                // Transfer tokens
                const tokenAmount = new anchor.BN(amount * Math.pow(10, CONFIG.tokenDecimals));
                const txSignature = yield this.program.methods
                    .transferDev(tokenAmount)
                    .accounts({
                    from: senderTokenAccount,
                    to: recipientAta,
                    authority: this.payer,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                })
                    .rpc();
                const explorerLink = CONFIG.mainnet
                    ? `https://explorer.solana.com/tx/${txSignature}`
                    : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
                logger.info(`Transfer to dev team successful! TX: ${explorerLink}`);
            }
            catch (error) {
                logger.error("Error transferring to dev team:", error);
                throw error;
            }
        });
    }
    /**
     * Transfer tokens to marketing team (adapted from test function)
     */
    transferToMarketing(amount) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(`Transferring ${amount} tokens to marketing team`);
            try {
                // Set up compute budget instruction for larger TX
                const modifyComputeUnits = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                    units: 600000
                });
                const marketingWallet = CONFIG.destinations.marketing;
                const senderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, this.payer);
                const recipientAta = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, marketingWallet);
                // First check if recipient ATA exists, create if needed
                try {
                    const accountInfo = yield this.connection.getAccountInfo(recipientAta);
                    if (!accountInfo) {
                        logger.info("Marketing team's ATA does not exist. Creating ATA...");
                        const createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, marketingWallet, this.mintAddress);
                        const createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
                        yield this.program.provider.sendAndConfirm(createAtaTx);
                        logger.info("Created marketing team's associated token account");
                    }
                    else {
                        logger.info("Found existing ATA for marketing team");
                    }
                }
                catch (e) {
                    logger.error("Error checking marketing team ATA; attempting to create:", e);
                    const createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, marketingWallet, this.mintAddress);
                    const createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
                    yield this.program.provider.sendAndConfirm(createAtaTx);
                }
                // Transfer tokens
                const tokenAmount = new anchor.BN(amount * Math.pow(10, CONFIG.tokenDecimals));
                const txSignature = yield this.program.methods
                    .marketingTransfer(tokenAmount)
                    .accounts({
                    from: senderTokenAccount,
                    to: recipientAta,
                    authority: this.payer,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                })
                    .preInstructions([modifyComputeUnits])
                    .rpc();
                const explorerLink = CONFIG.mainnet
                    ? `https://explorer.solana.com/tx/${txSignature}`
                    : `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
                logger.info(`Transfer to marketing team successful! TX: ${explorerLink}`);
            }
            catch (error) {
                logger.error("Error transferring to marketing team:", error);
                throw error;
            }
        });
    }
    /**
     * Core function to mint tokens when a milestone is reached
     */
    mintForMilestone(milestone) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info(`🎯 Starting mint for milestone: ${milestone.name}`);
            try {
                // Check if already processed locally
                if (this.lastProcessedState.processedMilestones.has(milestone.index)) {
                    logger.info(`Milestone ${milestone.name} already processed locally`);
                    return false;
                }
                // Verify token state and check if milestone already used
                const tokenState = yield this.program.account.tokenState.fetch(this.tokenStateAddress);
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
                const destination = yield anchor.utils.token.associatedAddress({
                    mint: this.mintAddress,
                    owner: this.payer,
                });
                // Mint 5M tokens
                const mintAmount = new anchor.BN(5000000 * Math.pow(10, CONFIG.tokenDecimals));
                const txHash = yield this.program.methods
                    .mintToken(mintAmount)
                    .accounts({
                    mint: this.mintAddress,
                    destination,
                    tokenState: this.tokenStateAddress,
                    payer: this.payer,
                    rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
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
                yield new Promise(resolve => setTimeout(resolve, 5000));
                const updatedTokenState = yield this.program.account.tokenState.fetch(this.tokenStateAddress);
                if (!updatedTokenState.mintConditionsUsed[milestone.index]) {
                    logger.warn(`Warning: Mint transaction confirmed but milestone ${milestone.index} not marked as used in token state`);
                }
                return true;
            }
            catch (error) {
                logger.error(`Error minting tokens for milestone ${milestone.name}:`, error);
                return false;
            }
        });
    }
    // ==== Milestone Monitoring Services ====
    /**
     * Monitor challenge completions for milestones (adapted from test function)
     */
    monitorChallengeCompletions() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.running)
                return;
            logger.info("Checking challenge completion milestones");
            let retryAttempt = 0;
            try {
                // Initialize tracker if needed
                yield this.initializeChallengeTrackerIfNeeded();
                // Fetch current state
                const tracker = yield this.program.account.challengeTracker.fetch(this.challengeTrackerPda);
                const currentChallengeCount = tracker.totalChallenges.toNumber();
                // Check if anything changed
                if (currentChallengeCount !== this.lastProcessedState.challengeCount) {
                    logger.info(`Challenge count changed: ${this.lastProcessedState.challengeCount} -> ${currentChallengeCount}`);
                    // Check each milestone
                    for (const milestone of CONFIG.milestones.challenges) {
                        if (currentChallengeCount >= milestone.threshold &&
                            !this.lastProcessedState.processedMilestones.has(milestone.index)) {
                            logger.info(`🎉 Challenge milestone reached: ${milestone.name}`);
                            yield this.mintForMilestone(milestone);
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
            }
            catch (error) {
                logger.error("Error in challenge monitoring:", error);
                yield exponentialBackoff(retryAttempt++);
            }
        });
    }
    /**
     * Monitor participation fees for milestones (adapted from test function)
     */
    monitorParticipationFees() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.running)
                return;
            logger.info("Checking participation fee milestones");
            let retryAttempt = 0;
            try {
                // Initialize tracker if needed
                yield this.initializeFeeTrackerIfNeeded();
                // Fetch current state
                const feeTracker = yield this.program.account.feeTracker.fetch(this.feeTrackerPda);
                const currentRawFees = feeTracker.totalParticipationFees.toNumber();
                // Check if anything changed
                if (currentRawFees !== this.lastProcessedState.feeAmount) {
                    logger.info(`Fee amount changed: ${formatTokenAmount(this.lastProcessedState.feeAmount)} -> ${formatTokenAmount(currentRawFees)} CPT`);
                    // Check each milestone
                    for (const milestone of CONFIG.milestones.entryFees) {
                        if (currentRawFees >= milestone.threshold &&
                            !this.lastProcessedState.processedMilestones.has(milestone.index)) {
                            logger.info(`🎉 Fee milestone reached: ${milestone.name}`);
                            yield this.mintForMilestone(milestone);
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
            }
            catch (error) {
                logger.error("Error in fee monitoring:", error);
                yield exponentialBackoff(retryAttempt++);
            }
        });
    }
    /**
     * Monitor wallet counts for milestones (adapted from test function)
     */
    monitorWalletMilestones() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.running)
                return;
            logger.info("Checking wallet count milestones");
            let retryAttempt = 0;
            try {
                // Find all token accounts for this mint
                logger.debug("Scanning for wallet holders...");
                const tokenAccounts = yield this.connection.getProgramAccounts(spl_token_1.TOKEN_PROGRAM_ID, {
                    filters: [
                        { dataSize: 165 }, // Token account size
                        { memcmp: { offset: 0, bytes: this.mintAddress.toBase58() } }, // Filter by mint
                    ],
                });
                // Count unique wallet addresses with non-zero balance
                const uniqueWallets = new Set();
                for (const account of tokenAccounts) {
                    const data = account.account.data;
                    const owner = new web3_js_1.PublicKey(data.slice(32, 64));
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
                            yield this.mintForMilestone(milestone);
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
            }
            catch (error) {
                logger.error("Error in wallet monitoring:", error);
                yield exponentialBackoff(retryAttempt++);
            }
        });
    }
    // ==== Helper Functions ====
    initializeChallengeTrackerIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const trackerAccount = yield this.connection.getAccountInfo(this.challengeTrackerPda);
                if (!trackerAccount) {
                    logger.info("Challenge tracker account doesn't exist. Initializing...");
                    yield this.program.methods
                        .initializeChallengeTracker()
                        .accounts({
                        authority: this.payer,
                        challengeTracker: this.challengeTrackerPda,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    })
                        .rpc();
                    logger.info("Challenge tracker initialized successfully!");
                }
            }
            catch (error) {
                logger.error("Error checking/initializing challenge tracker:", error);
                throw error;
            }
        });
    }
    initializeFeeTrackerIfNeeded() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const feeTrackerAccount = yield this.connection.getAccountInfo(this.feeTrackerPda);
                if (!feeTrackerAccount) {
                    logger.info("Fee tracker account doesn't exist. Initializing...");
                    yield this.program.methods
                        .initializeFeeTracker()
                        .accounts({
                        authority: this.payer,
                        feeTracker: this.feeTrackerPda,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    })
                        .rpc();
                    logger.info("Fee tracker initialized successfully!");
                }
            }
            catch (error) {
                logger.error("Error checking/initializing fee tracker:", error);
                throw error;
            }
        });
    }
    // ==== Main Runner Functions ====
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.info("Starting Coinpetitive service");
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
                    yield this.monitorChallengeCompletions();
                    yield this.monitorParticipationFees();
                    yield this.monitorWalletMilestones();
                    logger.debug(`Completed monitoring cycle, waiting ${CONFIG.checkIntervalSeconds} seconds...`);
                    yield new Promise(resolve => setTimeout(resolve, CONFIG.checkIntervalSeconds * 1000));
                }
                catch (error) {
                    logger.error("Error in monitoring cycle:", error);
                    yield new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s on error
                }
            }
        });
    }
    shutdown() {
        logger.info("Shutting down service...");
        this.running = false;
        this.saveState();
        logger.info("Shutdown complete, exiting");
        process.exit(0);
    }
}
exports.CoinpetitiveService = CoinpetitiveService;
// =============== MAIN ENTRY POINT ===============
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const service = new CoinpetitiveService();
            yield service.start();
        }
        catch (error) {
            logger.error("Fatal error:", error);
            process.exit(1);
        }
    });
}
// Command line argument parsing for one-time operations
function runCommand(command, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const service = new CoinpetitiveService();
        try {
            switch (command) {
                case 'init-token':
                    yield service.initToken();
                    break;
                case 'mint':
                    const amount = args.length > 0 ? parseInt(args[0]) : 21000000;
                    yield service.mintTokens(amount);
                    break;
                case 'transfer-founder':
                    const founderAmount = args.length > 0 ? parseInt(args[0]) : 1100000;
                    yield service.transferToFounder(founderAmount);
                    break;
                case 'transfer-dev':
                    const devAmount = args.length > 0 ? parseInt(args[0]) : 500000;
                    yield service.transferToDev(devAmount);
                    break;
                case 'transfer-marketing':
                    const marketingAmount = args.length > 0 ? parseInt(args[0]) : 500000;
                    yield service.transferToMarketing(marketingAmount);
                    break;
                case 'monitor':
                    yield service.start();
                    break;
                default:
                    logger.error(`Unknown command: ${command}`);
                    console.log("Available commands: init-token, mint, transfer-founder, transfer-dev, transfer-marketing, monitor");
            }
        }
        catch (error) {
            logger.error(`Error executing command ${command}:`, error);
            process.exit(1);
        }
    });
}
// Run if invoked directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'monitor';
    if (command === 'monitor') {
        logger.info("Coinpetitive monitoring service starting");
        main().catch(err => {
            logger.error("Unexpected error in main:", err);
            process.exit(1);
        });
    }
    else {
        runCommand(command, args.slice(1)).catch(err => {
            logger.error("Command execution failed:", err);
            process.exit(1);
        });
    }
}
exports.default = CoinpetitiveService;
