"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { NearConnector } from "@hot-labs/near-connect";
import type { NearPublicConfig } from "@/lib/near/shared";

export type WalletCall = {
  receiverId: string;
  methodName: string;
  args: Record<string, unknown>;
  gasTgas: number;
  deposit: string;
};

type NearWallet = {
  accountId: string | null;
  ready: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Sends each call as its own transaction from the connected wallet; returns their hashes in order. */
  send: (calls: WalletCall[]) => Promise<string[]>;
};

const Ctx = createContext<NearWallet | null>(null);

export function useNearWallet(): NearWallet {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNearWallet must be used inside NearProvider");
  return ctx;
}

const toAction = (c: WalletCall) => ({
  type: "FunctionCall" as const,
  params: { methodName: c.methodName, args: c.args, gas: (BigInt(c.gasTgas) * 1_000_000_000_000n).toString(), deposit: c.deposit },
});

export default function NearProvider({ config, children }: { config: NearPublicConfig; children: React.ReactNode }) {
  const connectorRef = useRef<NearConnector | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { NearConnector } = await import("@hot-labs/near-connect");
      const connector = new NearConnector({
        network: config.network,
        features: config.network === "testnet" ? { signAndSendTransaction: true, testnet: true } : { signAndSendTransaction: true },
        footerBranding: null,
      });
      connector.on("wallet:signIn", (t) => setAccountId(t.accounts[0]?.accountId ?? null));
      connector.on("wallet:signOut", () => setAccountId(null));
      connectorRef.current = connector;
      await connector.whenManifestLoaded;
      try {
        const { accounts } = await connector.getConnectedWallet();
        if (!cancelled) setAccountId(accounts[0]?.accountId ?? null);
      } catch {
        // no wallet connected yet
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [config.network]);

  const connect = useCallback(async () => {
    const connector = connectorRef.current;
    if (!connector) return;
    await connector.whenManifestLoaded;
    await connector.connect();
  }, []);

  const disconnect = useCallback(async () => {
    await connectorRef.current?.disconnect();
    setAccountId(null);
  }, []);

  const send = useCallback(async (calls: WalletCall[]) => {
    const connector = connectorRef.current;
    if (!connector) throw new Error("Wallet is still loading");
    const wallet = await connector.wallet();
    if (calls.length === 1) {
      const c = calls[0];
      const result = await wallet.signAndSendTransaction({ receiverId: c.receiverId, actions: [toAction(c)] });
      return [result.transaction.hash];
    }
    const results = await wallet.signAndSendTransactions({
      transactions: calls.map((c) => ({ receiverId: c.receiverId, actions: [toAction(c)] })),
    });
    return results.map((r) => r.transaction.hash);
  }, []);

  return <Ctx.Provider value={{ accountId, ready, connect, disconnect, send }}>{children}</Ctx.Provider>;
}
