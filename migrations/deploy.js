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
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
module.exports = function (provider) {
    return __awaiter(this, void 0, void 0, function* () {
        // Configure client to use the provider
        anchor.setProvider(provider);
        // Get program ID from your deployed program
        const programId = new anchor.web3.PublicKey("9ZVc4bXMx6KDkJLVzQsk6pxqMe5BtGqg8NPkJXpxfY5r");
        // Create program interface
        const program = new anchor_1.Program(require("../target/idl/coinpetitive.json"), provider);
        try {
            // Initialize program state if needed
            const stateAccount = web3_js_1.Keypair.generate();
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
        }
        catch (error) {
            console.error("Deployment failed:", error);
            throw error;
        }
    });
};
