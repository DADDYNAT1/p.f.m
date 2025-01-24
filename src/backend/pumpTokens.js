const { Connection, PublicKey } = require("@solana/web3.js");

const CHAINSTACK_RPC = "https://solana-mainnet.core.chainstack.com/55a33aac970c1baabb5b84fecd188af7";

const connection = new Connection(CHAINSTACK_RPC);

async function fetchPumpFunTokens() {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 86400;

    try {
        const recentSignatures = await connection.getSignaturesForAddress(
            new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"),
            { limit: 50 }
        );

        const transactionPromises = recentSignatures
            .filter((sig) => sig.blockTime && sig.blockTime >= oneDayAgo)
            .map((sig) =>
                connection.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 })
            );

        const transactions = await Promise.allSettled(transactionPromises);

        const recentTokens = [];
        transactions.forEach((result) => {
            if (result.status === "fulfilled" && result.value) {
                const transaction = result.value;
                if (transaction?.transaction?.message) {
                    const { accountKeys } = transaction.transaction.message;
                    if (accountKeys && accountKeys.length > 0) {
                        const tokenName = accountKeys[0].toString();
                        const volumeLamports = transaction.meta?.postBalances?.[0] || 0;
                        const volumeSol = volumeLamports / 1_000_000_000; // Convert to SOL
                        const createdTime = new Date(transaction.blockTime * 1000).toLocaleString(); // Convert to string

                        recentTokens.push({
                            name: tokenName,
                            volume: volumeSol,
                            created: createdTime, // Pass formatted string
                        });
                    }
                }
            }
        });

        console.log(`Found ${recentTokens.length} tokens created in the last 24 hours.`);
        return recentTokens;
    } catch (error) {
        console.error("Error fetching Pump.fun tokens:", error);
        return [];
    }
}

module.exports = { fetchPumpFunTokens };
