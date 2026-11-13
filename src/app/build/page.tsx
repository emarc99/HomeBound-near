import { Header } from "@/components/Header";
import { BuildWorkspace } from "@/components/BuildWorkspace";
import { nearAiModel } from "@/lib/ai/nearai";
import { toClientView, type ClientNear } from "@/lib/client-view";
import { nearPublicConfig } from "@/lib/near/config";
import { getChainProject, getRegisteredSigner, usdcBalance } from "@/lib/near/views";
import { getHeroProject, getProjectView } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const cfg = nearPublicConfig();
  const model = nearAiModel();
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
  const [chain, registeredSigner] = await Promise.all([
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

  return (
    <>
      <Header wallet={true} />
      <BuildWorkspace initial={clientView} />
    </>
  );
}
