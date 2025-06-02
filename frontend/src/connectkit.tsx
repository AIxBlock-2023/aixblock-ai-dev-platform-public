"use client";

import React from "react";

import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { authWalletConnectors } from "@particle-network/connectkit/auth";
import type { Chain } from "@particle-network/connectkit/chains";
import { aa } from "@particle-network/connectkit/aa";
import { defineChain } from "@particle-network/connectkit/chains";
import {
  solanaWalletConnectors,
  injected,
} from "@particle-network/connectkit/solana";
import {
  PARTICLE_APP_ID,
  PARTICLE_CLIENT_KEY,
  PARTICLE_PROJECT_ID,
  QUICKNODE_RPC_URL,
  SOLANA_MAINNET_CHAIN_ID,
} from "./utils/constants";

const projectId = PARTICLE_PROJECT_ID;
const clientKey = PARTICLE_CLIENT_KEY;
const appId = PARTICLE_APP_ID;

if (!projectId || !clientKey || !appId) {
  throw new Error("Please configure the Particle project in .env first!");
}

const solanaMainnet = defineChain({
  id: SOLANA_MAINNET_CHAIN_ID,
  name: "Solana",
  nativeCurrency: {
    decimals: 6,
    name: "Solana",
    symbol: "SOL",
  },
  rpcUrls: {
    default: {
      http: ["https://api.mainnet-beta.solana.com", QUICKNODE_RPC_URL],
    },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://solscan.io/" },
  },
  testnet: false,
});
const supportChains: Chain[] = [solanaMainnet];

const config = createConfig({
  projectId,
  clientKey,
  appId,
  appearance: {
    recommendedWallets: [
      { walletId: "phantom", label: "Recommended" },
      { walletId: "coinbaseWallet", label: "Popular" },
      { walletId: "bitKeep", label: "Popular" },
      { walletId: "trustWallet", label: "Popular" },
      { walletId: "okxWallet", label: "Popular" },
    ],
    language: "en-US",
  },
  walletConnectors: [
    authWalletConnectors({
      authTypes: [
        "email",
        "google",
        "apple",
        "twitter",
        "github",
        "telegram",
        "discord",
        "twitch",
        "microsoft",
        "linkedin",
      ],
    }),
    // solana start
    solanaWalletConnectors({
      connectorFns: [
        injected({ target: "phantom" }),
        injected({ target: "coinbaseWallet" }),
        injected({ target: "bitKeep" }),
        injected({ target: "trustWallet" }),
        injected({ target: "okxWallet" }),
      ],
    }),
    // solana end
  ],
  plugins: [
    // embedded wallet start
    aa({
      name: "BICONOMY",
      version: "2.0.0",
    }),
    // aa config end
  ],
  chains: supportChains as unknown as readonly [Chain, ...Chain[]],
});

// Wrap your application with this component.
export const ParticleConnectkit = ({ children }: React.PropsWithChildren) => {
  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
};
