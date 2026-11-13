import { Header } from "@/components/Header";
import { BuildWorkspace } from "@/components/BuildWorkspace";
import { getDb } from "@/db";
import { nearAiModel } from "@/lib/ai/nearai";
import { toClientView, type ClientNear } from "@/lib/client-view";
import { verifyLedger } from "@/lib/ledger";
import { nearPublicConfig } from "@/lib/near/config";
import { getChainProject, getRegisteredSigner, usdcBalance } from "@/lib/near/views";
import { getHeroProject, getLedger, getProjectView } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const cfg = nearPublicConfig();
  const model = nearAiModel();
  const db = await getDb();
  const hero = await getHeroProject();
  const view = hero ? await getProjectView(hero.id) : null;

  if (!hero || !view) {
    return (
      <>
        <Header wallet={true} />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
          <div className="card">
            <h1 className="text-2xl font-bold">No seeded project found</h1>
            <p className="mt-2 text-sm text-muted">Restart with seeding enabled to initialize the demo project.</p>
          </div>
        </main>
      </>
    );
  }

  let readError: string | null = null;
  const [ledgerRows, integrity, chain, registeredSigner] = await Promise.all([
    getLedger(hero.id, 60),
    verifyLedger(db),
    hero.nearProjectId
      ? getChainProject(hero.nearProjectId).catch((err) => {
          readError = err instanceof Error ? err.message : "Could not read project from NEAR RPC";
          return null;
        })
      : Promise.resolve(null),
    getRegisteredSigner(model).catch(() => null),
  ]);

  const contractorParty = view.parties.find((p) => p.role === "contractor" && p.nearAccountId);
  const contractorAccount = chain?.stages[0]?.payee ?? contractorParty?.nearAccountId ?? null;
  const contractorUsdc = contractorAccount ? await usdcBalance(contractorAccount).catch(() => null) : null;

  const near: ClientNear = {
    config: cfg,
    nearProjectId: hero.nearProjectId,
    chain,
    contractorAccount,
    contractorUsdc,
    registeredSigner,
    readError,
  };

  const clientView = toClientView(view, near);
  const clientLedger = ledgerRows.map((ev) => ({
    id: ev.id,
    seq: ev.seq,
    type: ev.type,
    actor: ev.actor,
    hash: ev.hash,
    prevHash: ev.prevHash,
    payload: ev.payload,
    createdAt: ev.createdAt.toISOString(),
  }));

  return (
    <>
      <Header wallet={true} />
      <BuildWorkspace initial={clientView} ledger={clientLedger} integrity={integrity} nearAiModelName={model} />
    </>
  );
}
