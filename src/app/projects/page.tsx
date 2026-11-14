import Link from "next/link";
import { Header } from "@/components/Header";
import { ProjectsPortfolioClient } from "@/components/projects/ProjectsPortfolioClient";
import { getAllPortfolioProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Projects Register — HomeBound",
  description:
    "Completed diaspora residences and live NEAR escrow builds verified stage-by-stage with architectural drawings and Circle USDC settlements.",
};

export default async function ProjectsPage() {
  const projects = await getAllPortfolioProjects();

  return (
    <>
      <Header wallet={false} />
      <main className="flex-1 bg-paper">
        <ProjectsPortfolioClient projects={projects} />

        {/* QUIET EDITORIAL BOTTOM CORRIDOR BAND */}
        <section className="border-t border-dashed border-ink/25 bg-card">
          <div className="mx-auto flex max-w-[1340px] flex-wrap items-center justify-between gap-6 px-6 py-14 md:px-10">
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                + COMMISSION &amp; ESCROW SANDBOX
              </p>
              <h2 className="mt-2 font-sans text-2xl font-medium tracking-[-0.02em] text-ink md:text-3xl">
                Want to inspect a live NEAR Testnet contract directly?
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/build" className="btn-pop">
                Open Live Escrow (/build) →
              </Link>
              <Link href="/verify" className="btn-ghost">
                Inspect Bookkeeper Ledger
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
