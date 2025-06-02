import { SOLANA_MAINNET_CHAIN_ID } from "./constants";

const MAINNET_TOKEN = {
  USDC: {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimal: 6,
  },
};

const TESTNET_TOKEN = {
  USDC: {
    address: "BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k",
    decimal: 6,
  },
};

export const getTokenByChainId = (chainId: number) => {
  if (chainId === SOLANA_MAINNET_CHAIN_ID) {
    return MAINNET_TOKEN;
  }
  return TESTNET_TOKEN;
};
