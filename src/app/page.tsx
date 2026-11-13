import { Header } from "@/components/Header";
import { LandingInteractive } from "@/components/LandingInteractive";
import { nearPublicConfig } from "@/lib/near/config";

export default function Home() {
  const cfg = nearPublicConfig();

  return (
    <>
      <Header wallet={false} />
      <LandingInteractive
        escrowAccount={cfg.escrow}
        agentAccount={cfg.agent}
        network={cfg.network}
      />
    </>
  );
}
