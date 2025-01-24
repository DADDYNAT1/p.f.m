import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl } from '@project-serum/anchor';
import * as anchor from '@project-serum/anchor';
import { Metadata, MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';

// Define IDL type with proper structure
interface TokenManagerIdl extends Idl {
  version: string;
  name: string;
  instructions: [];
  accounts: [
    {
      name: 'tokenManager';
      type: {
        kind: 'struct';
        fields: [
          { name: 'authority', type: 'publicKey' },
          { name: 'token_mint', type: 'publicKey' },
          { name: 'token_price', type: 'u64' },
          { name: 'total_supply', type: 'u64' },
          { name: 'tokens_sold', type: 'u64' }
        ];
      };
    }
  ];
}

// Define IDL constant
const IDL: TokenManagerIdl = {
  version: '0.1.0',
  name: 'token_manager',
  instructions: [],
  accounts: [
    {
      name: 'tokenManager',
      type: {
        kind: 'struct',
        fields: [
          { name: 'authority', type: 'publicKey' },
          { name: 'token_mint', type: 'publicKey' },
          { name: 'token_price', type: 'u64' },
          { name: 'total_supply', type: 'u64' },
          { name: 'tokens_sold', type: 'u64' }
        ]
      }
    }
  ]
};

// Pump.fun Program ID
const PUMP_FUN_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

// RPC Connection
const CHAINSTACK_RPC = "https://solana-mainnet.core.chainstack.com/55a33aac970c1baabb5b84fecd188af7";
const connection = new Connection(CHAINSTACK_RPC, "confirmed");

// Program ID and wallet setup
const walletKeypair = Keypair.generate();
const wallet = new Wallet(walletKeypair);

// Create provider and program instances
const provider = new AnchorProvider(connection, wallet, {
  preflightCommitment: 'confirmed',
});

// Initialize program with IDL type
const program = new Program(IDL, PUMP_FUN_PROGRAM_ID, provider);

// Define TokenManagerAccount type
interface TokenManagerAccount {
  authority: PublicKey;
  token_mint: PublicKey;
  token_price: anchor.BN;
  total_supply: anchor.BN;
  tokens_sold: anchor.BN;
}

// Function to fetch token information with enhanced features
export async function fetchTokens(tokenManagerAddress: string): Promise<{
  success: boolean;
  data?: {
    authority: string;
    tokenMint: string;
    tokenPrice: string;
    totalSupply: string;
    tokensSold: string;
    mintInfo: {
      decimals: number;
      supply: bigint;
    };
    metadata: {
      name: string;
      symbol: string;
      uri: string;
    } | null;
  };
  error?: string;
  timestamp?: string;
}> {
  try {
    // Validate input address
    if (!tokenManagerAddress || tokenManagerAddress.length < 32) {
      throw new Error('Invalid token manager address');
    }

    // Convert address to PublicKey
    const tokenManagerPubkey = new PublicKey(tokenManagerAddress);

    // Fetch token manager account data with timeout
    const tokenManagerAccount = (await program.account.tokenManager.fetch(tokenManagerPubkey)) as TokenManagerAccount;

    // Fetch associated token mint information
    const tokenMintInfo = await connection.getAccountInfo(tokenManagerAccount.token_mint);
    if (!tokenMintInfo) {
      throw new Error('Token mint info not found');
    }

    // Fetch token metadata using Metaplex
    const [metadataPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        MPL_TOKEN_METADATA_PROGRAM_ID.toBytes(),
        tokenManagerAccount.token_mint.toBytes(),
      ],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );
    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    const metadata = metadataAccount ? Metadata.fromAccountInfo(metadataAccount)[0] : null;

    return {
      success: true,
      data: {
        authority: tokenManagerAccount.authority.toString(),
        tokenMint: tokenManagerAccount.token_mint.toString(),
        tokenPrice: tokenManagerAccount.token_price.toString(),
        totalSupply: tokenManagerAccount.total_supply.toString(),
        tokensSold: tokenManagerAccount.tokens_sold.toString(),
        mintInfo: {
          decimals: tokenMintInfo.data[44],
          supply: tokenMintInfo.data.readBigUInt64LE(36),
        },
        metadata: metadata
          ? {
              name: metadata.data.name,
              symbol: metadata.data.symbol,
              uri: metadata.data.uri,
            }
          : null,
      },
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error fetching token data:', err);
    return {
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    };
  }
}
