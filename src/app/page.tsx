import { Header } from "@/components/Header";
import { LandingInteractive } from "@/components/LandingInteractive";
import { toClientView, type ClientNear } from "@/lib/client-view";
import { nearPublicConfig } from "@/lib/near/config";
import { getChainProject } from "@/lib/near/views";
import { getHeroProject, getProjectView } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cfg = nearPublicConfig();
  const hero = await getHeroProject();
  const view = hero ? await getProjectView(hero.id) : null;
  const chain = hero?.nearProjectId ? await getChainProject(hero.nearProjectId).catch(() => null) : null;

  const near: ClientNear = {
    config: cfg,
    nearProjectId: hero?.nearProjectId ?? null,
    chain,
    contractorAccount: null,
    contractorUsdc: null,
    registeredSigner: null,
    readError: null,
  };
  const clientView = view ? toClientView(view, near) : null;

  return (
    <>
      <Header wallet={false} />
      <LandingInteractive
        escrowAccount={cfg.escrow}
        agentAccount={cfg.agent}
        network={cfg.network}
        stages={clientView?.stages}
      />
    </>
  );
}
