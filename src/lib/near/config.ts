import "server-only";
import type { NearPublicConfig } from "./shared";

export function nearRpcUrl(): string {
  return process.env.NEAR_RPC_URL || "https://test.rpc.fastnear.com";
}

export function nearPublicConfig(): NearPublicConfig {
  const network = process.env.NEAR_NETWORK === "mainnet" ? "mainnet" : "testnet";
  return {
    network,
    escrow: process.env.NEAR_ESCROW_CONTRACT || "escrow.homebound-hq.testnet",
    usdc: process.env.NEAR_USDC_CONTRACT || "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af",
    agent: process.env.NEAR_AGENT_ACCOUNT || "agent.homebound-hq.testnet",
    explorer: network === "mainnet" ? "https://nearblocks.io" : "https://testnet.nearblocks.io",
    demoDivisor: Number(process.env.NEAR_DEMO_DIVISOR || 1000),
  };
}

export const isAgentConfigured = () => Boolean(process.env.NEAR_AGENT_PRIVATE_KEY);
