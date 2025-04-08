"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
var anchor = require("@coral-xyz/anchor");
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var fs = require("fs");
var winston = require("winston");
// Configure logger
var logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.printf(function (_a) {
        var timestamp = _a.timestamp, level = _a.level, message = _a.message;
        return "".concat(timestamp, " [").concat(level.toUpperCase(), "]: ").concat(message);
    })),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'coinpetitive-token-ops.log' })
    ]
});
// Destinations for token transfers
var DESTINATIONS = {
    founder: new web3_js_1.PublicKey("FuFzoMF5xTwZego84fRoscnart4dPYNkpHho2UBe7NDt"),
    dev: new web3_js_1.PublicKey("DhCu49epRCawP9Yp2ZoatzSvfmTewi2x73xEM6Vb2kh2"),
    marketing: new web3_js_1.PublicKey("973DKZUVJQqo11pXs74KzB1jwjrMMXLueBBiRCwi9Eh")
};
// Token metadata configuration
var TOKEN_METADATA = {
    name: "Coinpetitive",
    symbol: "CPT",
    uri: "https://gateway.pinata.cloud/ipfs/bafkreier252mzmzb5jdmhbiubo6bndnpplnlvh7ynuixargdmrxi4ci2ay",
    decimals: 7
};
// Token service class that handles initialization, minting, and transfers
var TokenService = /** @class */ (function () {
    function TokenService(program, mintAddress) {
        this.program = program;
        this.connection = program.provider.connection;
        this.payer = program.provider.publicKey;
        this.mintAddress = mintAddress;
        this.isMainnet = process.env.ENVIRONMENT === 'mainnet';
        // Token metadata program ID (from Metaplex)
        this.token_metadata_program_id = new web3_js_1.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
        // Derive metadata address PDA
        this.metadataAddress = web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from("metadata"),
            this.token_metadata_program_id.toBuffer(),
            this.mintAddress.toBuffer()
        ], this.token_metadata_program_id)[0];
    }
    /**
     * Initialize token
     */
    TokenService.prototype.initToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var info, context_1, txHash, explorerLink, newInfo, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.info("Initializing token...");
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.connection.getAccountInfo(this.mintAddress)];
                    case 2:
                        info = _a.sent();
                        if (info) {
                            logger.info("Token already initialized");
                            return [2 /*return*/];
                        }
                        logger.info("Mint not found. Initializing token...");
                        context_1 = {
                            metadata: this.metadataAddress,
                            mint: this.mintAddress,
                            payer: this.payer,
                            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                            systemProgram: anchor.web3.SystemProgram.programId,
                            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                            tokenMetadataProgram: this.token_metadata_program_id,
                        };
                        return [4 /*yield*/, this.program.methods
                                .initToken(TOKEN_METADATA)
                                .accounts(context_1)
                                .rpc()];
                    case 3:
                        txHash = _a.sent();
                        explorerLink = this.isMainnet
                            ? "https://explorer.solana.com/tx/".concat(txHash)
                            : "https://explorer.solana.com/tx/".concat(txHash, "?cluster=devnet");
                        logger.info("Token initialization successful! TX: ".concat(explorerLink));
                        return [4 /*yield*/, this.connection.getAccountInfo(this.mintAddress)];
                    case 4:
                        newInfo = _a.sent();
                        if (newInfo) {
                            logger.info("Mint successfully initialized");
                        }
                        else {
                            logger.error("Failed to initialize mint");
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        logger.error("Error initializing token:", error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Mint initial supply of tokens
     */
    TokenService.prototype.mintTokens = function (supply) {
        return __awaiter(this, void 0, void 0, function () {
            var destination, initialBalance, balance, e_1, context_2, amount, txHash, explorerLink, postBalance, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.info("Minting ".concat(supply, " tokens to address: ").concat(this.mintAddress.toString()));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        return [4 /*yield*/, anchor.utils.token.associatedAddress({
                                mint: this.mintAddress,
                                owner: this.payer,
                            })];
                    case 2:
                        destination = _a.sent();
                        initialBalance = 0;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.connection.getTokenAccountBalance(destination)];
                    case 4:
                        balance = _a.sent();
                        initialBalance = balance.value.uiAmount || 0;
                        logger.info("Initial balance: ".concat(initialBalance));
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _a.sent();
                        logger.info("No initial balance found");
                        return [3 /*break*/, 6];
                    case 6:
                        context_2 = {
                            mint: this.mintAddress,
                            destination: destination,
                            payer: this.payer,
                            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
                            systemProgram: anchor.web3.SystemProgram.programId,
                            tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                        };
                        amount = new anchor.BN(supply * Math.pow(10, TOKEN_METADATA.decimals));
                        logger.info("Minting ".concat(supply, " tokens to ").concat(this.payer.toString()));
                        return [4 /*yield*/, this.program.methods
                                .mintToken(amount)
                                .accounts(context_2)
                                .rpc()];
                    case 7:
                        txHash = _a.sent();
                        explorerLink = this.isMainnet
                            ? "https://explorer.solana.com/tx/".concat(txHash)
                            : "https://explorer.solana.com/tx/".concat(txHash, "?cluster=devnet");
                        logger.info("Token minting successful! TX: ".concat(explorerLink));
                        // Verify new balance
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                    case 8:
                        // Verify new balance
                        _a.sent();
                        return [4 /*yield*/, this.connection.getTokenAccountBalance(destination)];
                    case 9:
                        postBalance = (_a.sent()).value.uiAmount || 0;
                        logger.info("Final balance: ".concat(postBalance));
                        if (postBalance !== initialBalance + supply) {
                            logger.warn("Balance check failed. Expected ".concat(initialBalance + supply, ", got ").concat(postBalance));
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        error_2 = _a.sent();
                        logger.error("Error minting tokens:", error_2);
                        throw error_2;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transfer tokens to founder
     */
    TokenService.prototype.transferToFounder = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            var founderWallet, senderTokenAccount, recipientAta, accountInfo, createAtaIx, createAtaTx, e_2, createAtaIx, createAtaTx, tokenAmount, txSignature, explorerLink, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.info("Transferring ".concat(amount, " tokens to founder"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        founderWallet = DESTINATIONS.founder;
                        senderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, this.payer);
                        recipientAta = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, founderWallet);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        return [4 /*yield*/, this.connection.getAccountInfo(recipientAta)];
                    case 3:
                        accountInfo = _a.sent();
                        if (!!accountInfo) return [3 /*break*/, 5];
                        logger.info("Founder's ATA does not exist. Creating ATA...");
                        createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, founderWallet, this.mintAddress);
                        createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                        return [4 /*yield*/, this.program.provider.sendAndConfirm(createAtaTx)];
                    case 4:
                        _a.sent();
                        logger.info("Created founder's associated token account");
                        return [3 /*break*/, 6];
                    case 5:
                        logger.info("Found existing ATA for founder");
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_2 = _a.sent();
                        logger.error("Error checking founder ATA; attempting to create:", e_2);
                        createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, founderWallet, this.mintAddress);
                        createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                        return [4 /*yield*/, this.program.provider.sendAndConfirm(createAtaTx)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        tokenAmount = new anchor.BN(amount * Math.pow(10, TOKEN_METADATA.decimals));
                        return [4 /*yield*/, this.program.methods
                                .transferFounder(tokenAmount)
                                .accounts({
                                from: senderTokenAccount,
                                to: recipientAta,
                                authority: this.payer,
                                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                            })
                                .rpc()];
                    case 10:
                        txSignature = _a.sent();
                        explorerLink = this.isMainnet
                            ? "https://explorer.solana.com/tx/".concat(txSignature)
                            : "https://explorer.solana.com/tx/".concat(txSignature, "?cluster=devnet");
                        logger.info("Transfer to founder successful! TX: ".concat(explorerLink));
                        return [3 /*break*/, 12];
                    case 11:
                        error_3 = _a.sent();
                        logger.error("Error transferring to founder:", error_3);
                        throw error_3;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transfer tokens to dev team
     */
    TokenService.prototype.transferToDev = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            var devWallet, senderTokenAccount, recipientAta, accountInfo, createAtaIx, createAtaTx, e_3, createAtaIx, createAtaTx, tokenAmount, txSignature, explorerLink, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.info("Transferring ".concat(amount, " tokens to dev team"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        devWallet = DESTINATIONS.dev;
                        senderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, this.payer);
                        recipientAta = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, devWallet);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        return [4 /*yield*/, this.connection.getAccountInfo(recipientAta)];
                    case 3:
                        accountInfo = _a.sent();
                        if (!!accountInfo) return [3 /*break*/, 5];
                        logger.info("Dev team's ATA does not exist. Creating ATA...");
                        createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, devWallet, this.mintAddress);
                        createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                        return [4 /*yield*/, this.program.provider.sendAndConfirm(createAtaTx)];
                    case 4:
                        _a.sent();
                        logger.info("Created dev team's associated token account");
                        return [3 /*break*/, 6];
                    case 5:
                        logger.info("Found existing ATA for dev team");
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_3 = _a.sent();
                        logger.error("Error checking dev team ATA; attempting to create:", e_3);
                        createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, devWallet, this.mintAddress);
                        createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
                        return [4 /*yield*/, this.program.provider.sendAndConfirm(createAtaTx)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        tokenAmount = new anchor.BN(amount * Math.pow(10, TOKEN_METADATA.decimals));
                        return [4 /*yield*/, this.program.methods
                                .transferDev(tokenAmount)
                                .accounts({
                                from: senderTokenAccount,
                                to: recipientAta,
                                authority: this.payer,
                                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                            })
                                .rpc()];
                    case 10:
                        txSignature = _a.sent();
                        explorerLink = this.isMainnet
                            ? "https://explorer.solana.com/tx/".concat(txSignature)
                            : "https://explorer.solana.com/tx/".concat(txSignature, "?cluster=devnet");
                        logger.info("Transfer to dev team successful! TX: ".concat(explorerLink));
                        return [3 /*break*/, 12];
                    case 11:
                        error_4 = _a.sent();
                        logger.error("Error transferring to dev team:", error_4);
                        throw error_4;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transfer tokens to marketing team
     */
    TokenService.prototype.transferToMarketing = function (amount) {
        return __awaiter(this, void 0, void 0, function () {
            var modifyComputeUnits, marketingWallet, senderTokenAccount, recipientAta, accountInfo, createAtaIx, createAtaTx, e_4, createAtaIx, createAtaTx, tokenAmount, txSignature, explorerLink, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        logger.info("Transferring ".concat(amount, " tokens to marketing team"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        modifyComputeUnits = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
                            units: 600000
                        });
                        marketingWallet = DESTINATIONS.marketing;
                        senderTokenAccount = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, this.payer);
                        recipientAta = (0, spl_token_1.getAssociatedTokenAddressSync)(this.mintAddress, marketingWallet);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 9]);
                        return [4 /*yield*/, this.connection.getAccountInfo(recipientAta)];
                    case 3:
                        accountInfo = _a.sent();
                        if (!!accountInfo) return [3 /*break*/, 5];
                        logger.info("Marketing team's ATA does not exist. Creating ATA...");
                        createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, marketingWallet, this.mintAddress);
                        createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
                        return [4 /*yield*/, this.program.provider.sendAndConfirm(createAtaTx)];
                    case 4:
                        _a.sent();
                        logger.info("Created marketing team's associated token account");
                        return [3 /*break*/, 6];
                    case 5:
                        logger.info("Found existing ATA for marketing team");
                        _a.label = 6;
                    case 6: return [3 /*break*/, 9];
                    case 7:
                        e_4 = _a.sent();
                        logger.error("Error checking marketing team ATA; attempting to create:", e_4);
                        createAtaIx = (0, spl_token_1.createAssociatedTokenAccountInstruction)(this.payer, recipientAta, marketingWallet, this.mintAddress);
                        createAtaTx = new anchor.web3.Transaction().add(modifyComputeUnits, createAtaIx);
                        return [4 /*yield*/, this.program.provider.sendAndConfirm(createAtaTx)];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 9:
                        tokenAmount = new anchor.BN(amount * Math.pow(10, TOKEN_METADATA.decimals));
                        return [4 /*yield*/, this.program.methods
                                .marketingTransfer(tokenAmount)
                                .accounts({
                                from: senderTokenAccount,
                                to: recipientAta,
                                authority: this.payer,
                                tokenProgram: spl_token_1.TOKEN_PROGRAM_ID
                            })
                                .preInstructions([modifyComputeUnits])
                                .rpc()];
                    case 10:
                        txSignature = _a.sent();
                        explorerLink = this.isMainnet
                            ? "https://explorer.solana.com/tx/".concat(txSignature)
                            : "https://explorer.solana.com/tx/".concat(txSignature, "?cluster=devnet");
                        logger.info("Transfer to marketing team successful! TX: ".concat(explorerLink));
                        return [3 /*break*/, 12];
                    case 11:
                        error_5 = _a.sent();
                        logger.error("Error transferring to marketing team:", error_5);
                        throw error_5;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    // Setup provider helper (moved from main class)
    TokenService.setupProvider = function (rpcUrl) {
        var connection = new web3_js_1.Connection(rpcUrl || process.env.RPC_URL || "https://api.devnet.solana.com", "confirmed");
        // Use keypair from env or local file
        var keypair;
        if (process.env.PRIVATE_KEY) {
            var secretKey = Buffer.from(JSON.parse(process.env.PRIVATE_KEY));
            keypair = anchor.web3.Keypair.fromSecretKey(secretKey);
        }
        else {
            try {
                var keypairFile = JSON.parse(fs.readFileSync(process.env.KEYPAIR_FILE || "".concat(process.env.HOME, "/.config/solana/id.json"), "utf-8"));
                keypair = anchor.web3.Keypair.fromSecretKey(Uint8Array.from(keypairFile));
            }
            catch (e) {
                logger.error("Failed to load keypair:", e);
                throw new Error("No keypair found. Please provide PRIVATE_KEY env var or a KEYPAIR_FILE");
            }
        }
        return new anchor.AnchorProvider(connection, new anchor.Wallet(keypair), { commitment: "confirmed" });
    };
    // Factory method to create token service
    TokenService.create = function (programId, rpcUrl) {
        var provider = this.setupProvider(rpcUrl);
        // First correctly initialize the program
        var programPubkey = new web3_js_1.PublicKey(programId || "H7SvZyDYbZ7ioeCTYWE4wuVdgWUyA5XJ1CAZnsH7ga8E");
        var program = new anchor.Program(require("../target/idl/coinpetitive.json"), provider);
        // Now derive the mint address as a PDA
        var mintAddress = web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("mint")], program.programId)[0];
        logger.info("Using derived mint address: ".concat(mintAddress.toString()));
        return new TokenService(program, mintAddress);
    };
    return TokenService;
}());
exports.TokenService = TokenService;
// Example usage
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, command, tokenService, _a, mintAmount, founderAmount, devAmount, marketingAmount, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 13, , 14]);
                    args = process.argv.slice(2);
                    command = args[0];
                    if (!command) {
                        console.log("Please provide a command: init-token, mint, transfer-founder, transfer-dev, transfer-marketing");
                        process.exit(1);
                    }
                    tokenService = TokenService.create();
                    _a = command;
                    switch (_a) {
                        case 'init-token': return [3 /*break*/, 1];
                        case 'mint': return [3 /*break*/, 3];
                        case 'transfer-founder': return [3 /*break*/, 5];
                        case 'transfer-dev': return [3 /*break*/, 7];
                        case 'transfer-marketing': return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 11];
                case 1: return [4 /*yield*/, tokenService.initToken()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 3:
                    mintAmount = args[1] ? parseInt(args[1]) : 21000000;
                    return [4 /*yield*/, tokenService.mintTokens(mintAmount)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 5:
                    founderAmount = args[1] ? parseInt(args[1]) : 1100000;
                    return [4 /*yield*/, tokenService.transferToFounder(founderAmount)];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 7:
                    devAmount = args[1] ? parseInt(args[1]) : 500000;
                    return [4 /*yield*/, tokenService.transferToDev(devAmount)];
                case 8:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 9:
                    marketingAmount = args[1] ? parseInt(args[1]) : 500000;
                    return [4 /*yield*/, tokenService.transferToMarketing(marketingAmount)];
                case 10:
                    _b.sent();
                    return [3 /*break*/, 12];
                case 11:
                    console.error("Unknown command: ".concat(command));
                    console.log("Available commands: init-token, mint, transfer-founder, transfer-dev, transfer-marketing");
                    process.exit(1);
                    _b.label = 12;
                case 12:
                    logger.info("Successfully executed ".concat(command));
                    return [3 /*break*/, 14];
                case 13:
                    error_6 = _b.sent();
                    logger.error("Error executing command:", error_6);
                    process.exit(1);
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (require.main === module) {
    main().then(function () { return process.exit(0); });
}
exports.default = TokenService;
