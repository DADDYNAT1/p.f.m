import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const CHAINSTACK_RPC = "https://solana-mainnet.core.chainstack.com/55a33aac970c1baabb5b84fecd188af7";
const connection = new Connection(CHAINSTACK_RPC, "confirmed");

const PUMP_FUN_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

async function fetchTokens() {
  try {
    const programId = PUMP_FUN_PROGRAM_ID;

    const tokenAccounts = await connection.getProgramAccounts(programId, {
      filters: [{ dataSize: 165 }],
    });

    const tokens = await Promise.all(
      tokenAccounts.map(async (account, index) => {
        const mint = account.pubkey;

        // Fetch token metadata
        const metadata = await connection.getAccountInfo(mint);
        const symbol = metadata ? metadata.data.toString().substring(0, 4).replace(/\0/g, "") : "UNKN";

        // Calculate actual volume
        const volume = await calculateVolume(connection, mint);

        return {
          rank: index + 1,
          symbol,
          mint: mint.toBase58(),
          volume,
          createdAt: Math.floor(Date.now() / 1000), // Placeholder for actual creation time
        };
      })
    );

    return { data: tokens };
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return { data: [] };
  }
}

async function calculateVolume(connection: Connection, mint: PublicKey) {
  try {
    const signatures = await connection.getSignaturesForAddress(mint, { limit: 1000 });

    const transactions = await Promise.all(
      signatures.map((sig) =>
        connection.getTransaction(sig.signature, { maxSupportedTransactionVersion: 0 })
      )
    );

    let totalVolume = 0;

    for (const tx of transactions) {
      // Ensure `tx` and its `meta` property exist
      if (!tx || !tx.meta || !tx.meta.preTokenBalances || !tx.meta.postTokenBalances) {
        continue;
      }

      const tokenTransfers = tx.meta.preTokenBalances
        .filter((balance, i) => {
          const postBalance = tx.meta?.postTokenBalances?.[i];
          return (
            balance.mint === mint.toBase58() &&
            postBalance?.mint === mint.toBase58() &&
            balance.owner === postBalance?.owner
          );
        })
        .map((balance, i) => {
          const postBalance = tx.meta?.postTokenBalances?.[i];
          const preAmount = balance.uiTokenAmount?.uiAmount || 0;
          const postAmount = postBalance?.uiTokenAmount?.uiAmount || 0;
          return Math.abs(postAmount - preAmount);
        });

      totalVolume += tokenTransfers.reduce((sum, amount) => sum + amount, 0);
    }

    return totalVolume;
  } catch (error) {
    console.error("Error calculating volume:", error);
    return 0;
  }
}

export default fetchTokens;
