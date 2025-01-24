import { Connection, PublicKey } from "@solana/web3.js";
import { NextApiRequest, NextApiResponse } from "next";

// Static Program ID for Metaplex
const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// Pump.fun Program ID
const PUMP_FUN_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

// RPC Connection
const CHAINSTACK_RPC = "https://solana-mainnet.core.chainstack.com/55a33aac970c1baabb5b84fecd188af7";
const connection = new Connection(CHAINSTACK_RPC, "confirmed");

// Helper function to parse metadata manually
function parseMetadata(data: Buffer) {
    try {
        // Adjust offsets based on Metaplex's metadata structure
        const name = data.slice(0, 32).toString("utf-8").replace(/\0/g, "").trim();
        const symbol = data.slice(32, 36).toString("utf-8").replace(/\0/g, "").trim();
        const uri = data.slice(36, 236).toString("utf-8").replace(/\0/g, "").trim();

        return { name, symbol, uri };
    } catch (error) {
        console.error("Error parsing metadata buffer:", error);
        return { name: "Unknown", symbol: "Unknown", uri: "N/A" };
    }
}

// Main function to fetch tokens
async function fetchPumpFunTokens() {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;

    try {
        // Get recent signatures
        const signatures = await connection.getSignaturesForAddress(PUMP_FUN_PROGRAM_ID, { limit: 50 });
        const filteredSignatures = signatures.filter((sig) => sig.blockTime && sig.blockTime >= oneDayAgo);

        const transactions = await Promise.all(
            filteredSignatures.map((sig) =>
                connection.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 })
            )
        );

        const tokens: any[] = [];
        for (const tx of transactions) {
            if (tx?.transaction && tx.meta) {
                const instructions = tx.transaction.message.compiledInstructions;
                const accountKeys = tx.transaction.message.staticAccountKeys;

                for (const inst of instructions) {
                    const programId = accountKeys[inst.programIdIndex];
                    if (programId?.equals(PUMP_FUN_PROGRAM_ID)) {
                        const mintAddress = accountKeys[inst.accountKeyIndexes[0]]?.toString();
                        if (mintAddress) {
                            const [metadataAddress] = await PublicKey.findProgramAddress(
                                [
                                    Buffer.from("metadata"),
                                    METAPLEX_PROGRAM_ID.toBuffer(),
                                    new PublicKey(mintAddress).toBuffer(),
                                ],
                                METAPLEX_PROGRAM_ID
                            );

                            const metadataAccount = await connection.getAccountInfo(metadataAddress);
                            if (metadataAccount?.data) {
                                try {
                                    const { name, symbol, uri } = parseMetadata(metadataAccount.data);
                                    console.log("Parsed Metadata:", { name, symbol, uri });

                                    tokens.push({
                                        name: name || "Unknown",
                                        symbol: symbol || "Unknown",
                                        uri: uri || "N/A",
                                        created: new Date((tx.blockTime || 0) * 1000).toISOString(),
                                    });
                                } catch (err) {
                                    console.error("Failed to parse metadata:", err);
                                }
                            } else {
                                console.warn(`No metadata found for mint: ${mintAddress}`);
                            }
                        }
                    }
                }
            }
        }

        console.log("Extracted Tokens:", tokens);
        return tokens;
    } catch (error) {
        console.error("Error fetching Pump.fun tokens:", error);
        throw new Error("Failed to fetch Pump.fun tokens");
    }
}

// API Route Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const tokens = await fetchPumpFunTokens();
        res.status(200).json(tokens);
    } catch (error) {
        console.error("Error in API route:", error);
        res.status(500).json({ error: "Failed to fetch Pump.fun tokens" });
    }
}
