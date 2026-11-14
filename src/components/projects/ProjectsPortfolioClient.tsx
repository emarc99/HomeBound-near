"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CadFrame } from "@/components/landing/CadPrimitives";
import type { PortfolioProjectSummary } from "@/lib/queries";

type FilterMode = "all" | "completed" | "in_progress";
type ViewMode = "gallery" | "register";

function fmtUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtNgn(ngn: number) {
  if (ngn >= 1_000_000) {
    return `₦${(ngn / 1_000_000).toFixed(2)}M`;
  }
  return `₦${ngn.toLocaleString("en-US")}`;
}

export function ProjectsPortfolioClient({
  projects,
}: {
  projects: PortfolioProjectSummary[];
}) {
  const [filter, setFilter] = useState<FilterMode>("all");
  const [view, setView] = useState<ViewMode>("gallery");

  const stats = useMemo(() => {
    const completedCount = projects.filter((p) => p.completionStatus === "completed").length;
    const activeCount = projects.filter((p) => p.completionStatus === "in_progress").length;
    const totalVolumeUsd = projects.reduce((sum, p) => sum + p.totalUsdCents, 0);
    const settledUsd = projects.reduce((sum, p) => sum + p.settledUsdCents, 0);
    const totalStages = projects.reduce((sum, p) => sum + p.stageCount, 0);
    const settledStages = projects.reduce((sum, p) => sum + p.settledStageCount, 0);
    return {
      totalCount: projects.length,
      completedCount,
      activeCount,
      totalVolumeUsd,
      settledUsd,
      totalStages,
      settledStages,
    };
  }, [projects]);

  const filtered = useMemo(() => {
    if (filter === "all") return projects;
    return projects.filter((p) => p.completionStatus === filter);
  }, [projects, filter]);

  return (
    <div className="overflow-x-hidden bg-paper text-ink">
      {/* HERO & ARCHITECTURAL ARCHIVE HEADER */}
      <section className="mx-auto max-w-[1340px] px-6 pt-14 pb-16 md:px-10 md:pt-20 md:pb-24">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-6">
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
            + ARCHIVE 01 — 05 · SELECTED WORKS &amp; ATTESTED ESCROWS
          </p>
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
            WEST AFRICA · DIASPORA COMMISSION REGISTER
          </span>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="font-sans text-[clamp(2.5rem,5.4vw,4.75rem)] leading-[1.03] font-medium tracking-[-0.04em] text-ink">
              Architecture, settled
              <span className="block text-muted">stage by verified stage.</span>
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="text-[15px] leading-[1.75] text-muted">
              Every completed villa and active site build in the HomeBound register pairs architectural drawings,
              physical masonry telemetry, and Circle USDC milestone releases recorded on NEAR.
            </p>
          </div>
        </div>

        {/* AGGREGATE REGISTER TELEMETRY */}
        <div className="mt-14 grid gap-px border border-dashed border-ink/25 bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-paper p-6">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">Works in Register</p>
            <p className="mt-2 font-sans text-3xl font-medium tracking-[-0.03em] text-ink">
              {String(stats.totalCount).padStart(2, "0")}
              <span className="ml-2 font-mono text-xs font-normal text-leaf uppercase">
                ({stats.completedCount} Handed Over)
              </span>
            </p>
          </div>
          <div className="bg-paper p-6">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">Total Escrow Volume</p>
            <p className="mt-2 font-sans text-3xl font-medium tracking-[-0.03em] text-ink">
              {fmtUsd(stats.totalVolumeUsd)}
              <span className="ml-2 font-mono text-xs font-normal text-muted uppercase">USDC</span>
            </p>
          </div>
          <div className="bg-paper p-6">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">Capital Settled</p>
            <p className="mt-2 font-sans text-3xl font-medium tracking-[-0.03em] text-leaf">
              {fmtUsd(stats.settledUsd)}
              <span className="ml-2 font-mono text-xs font-normal text-muted uppercase">Verified</span>
            </p>
          </div>
          <div className="bg-paper p-6">
            <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">Milestones Released</p>
            <p className="mt-2 font-sans text-3xl font-medium tracking-[-0.03em] text-ink">
              {stats.settledStages}
              <span className="text-muted"> / {stats.totalStages}</span>
            </p>
          </div>
        </div>

        {/* FILTER & VIEW MODE BAR */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-ink/15 py-5">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter projects by status">
            {(
              [
                { id: "all", label: `All Works (${stats.totalCount})` },
                { id: "completed", label: `Completed (${stats.completedCount})` },
                { id: "in_progress", label: `Live Escrow (${stats.activeCount})` },
              ] as const
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`cursor-pointer rounded-[2px] px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition ${
                    active
                      ? "bg-ink text-paper"
                      : "border border-ink/20 bg-card text-ink hover:border-ink"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="mr-2 hidden font-mono text-[10px] tracking-[0.16em] text-muted uppercase sm:inline">
              Layout
            </span>
            <button
              type="button"
              onClick={() => setView("gallery")}
              className={`cursor-pointer rounded-[2px] px-3.5 py-2 font-mono text-[10px] tracking-[0.14em] uppercase transition ${
                view === "gallery"
                  ? "bg-vermilion text-[#f5f4f0]"
                  : "border border-ink/20 bg-card text-muted hover:text-ink"
              }`}
            >
              Monograph Gallery
            </button>
            <button
              type="button"
              onClick={() => setView("register")}
              className={`cursor-pointer rounded-[2px] px-3.5 py-2 font-mono text-[10px] tracking-[0.14em] uppercase transition ${
                view === "register"
                  ? "bg-vermilion text-[#f5f4f0]"
                  : "border border-ink/20 bg-card text-muted hover:text-ink"
              }`}
            >
              Technical Register
            </button>
          </div>
        </div>
      </section>

      {/* GALLERY VIEW: SPACIOUS HART OLIVEIRA / MOSS KELD ALTERNATING MONOGRAPHS */}
      {view === "gallery" ? (
        <section className="mx-auto max-w-[1340px] px-6 pb-28 md:px-10">
          <div className="divide-y divide-dashed divide-ink/20 border-b border-dashed border-ink/20">
            {filtered.map((project, index) => {
              const isCompleted = project.completionStatus === "completed";
              const isReversed = index % 2 === 1;
              const pct = project.stageCount
                ? Math.round((project.settledStageCount / project.stageCount) * 100)
                : 0;

              return (
                <article key={project.id} className="group py-16 md:py-24">
                  <div className="grid gap-10 md:grid-cols-12 md:items-center md:gap-12 lg:gap-16">
                    {/* ARCHITECTURAL PLATE */}
                    <div
                      className={`${
                        isReversed ? "md:order-2 md:col-span-7" : "md:order-1 md:col-span-7"
                      }`}
                    >
                      <Link href={`/projects/${project.slug}`} className="block">
                        <CadFrame
                          className="overflow-hidden bg-card p-3 transition duration-500 group-hover:border-ink/45 md:p-4"
                        >
                          <div className="relative aspect-[16/10] w-full overflow-hidden bg-plaster">
                            <Image
                              src={project.heroImage}
                              alt={`${project.name} architectural perspective`}
                              fill
                              sizes="(max-width: 1024px) 100vw, 58vw"
                              className="object-cover transition duration-700 ease-out group-hover:scale-[1.02]"
                            />

                            {/* Top Figure Pill */}
                            <div className="absolute top-4 left-4 flex items-center gap-2 border border-ink/25 bg-paper/92 px-3 py-1.5 backdrop-blur-xs">
                              <span className="font-mono text-[10px] font-semibold tracking-[0.16em] text-vermilion uppercase">
                                {project.code}
                              </span>
                              <span className="font-mono text-[10px] tracking-[0.14em] text-ink uppercase">
                                · {project.siteCity}, {project.siteState}
                              </span>
                            </div>

                            {/* Corner Architectural Drawing Peek */}
                            <div className="pointer-events-none absolute right-4 bottom-4 hidden w-44 overflow-hidden border border-ink/30 bg-paper p-1.5 shadow-lg transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:block sm:translate-y-2 sm:opacity-90">
                              <div className="relative aspect-[16/10] w-full overflow-hidden bg-plaster">
                                <Image
                                  src={project.sectionImage}
                                  alt={`${project.name} section sheet preview`}
                                  fill
                                  sizes="180px"
                                  className="object-cover"
                                />
                              </div>
                              <p className="mt-1 font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
                                Plan &amp; Section Sheet ↗
                              </p>
                            </div>
                          </div>
                        </CadFrame>
                      </Link>
                    </div>

                    {/* EDITORIAL METADATA & BRIEF */}
                    <div
                      className={`flex flex-col justify-between space-y-8 ${
                        isReversed ? "md:order-1 md:col-span-5" : "md:order-2 md:col-span-5"
                      }`}
                    >
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
                            WORK {String(index + 1).padStart(2, "0")} / {project.code}
                          </span>
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-2 rounded-[2px] border border-leaf/35 bg-mint/65 px-3 py-1 font-mono text-[10px] tracking-[0.15em] text-leaf uppercase">
                              ● Completed · {project.completedYear}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-[2px] border border-vermilion/35 bg-vermilion/10 px-3 py-1 font-mono text-[10px] tracking-[0.15em] text-vermilion uppercase">
                              ● Live Escrow · Stage 03 Active
                            </span>
                          )}
                        </div>

                        <Link href={`/projects/${project.slug}`} className="block">
                          <h2 className="font-sans text-3xl leading-[1.12] font-medium tracking-[-0.03em] text-ink transition group-hover:text-vermilion md:text-[2.5rem]">
                            {project.name}
                          </h2>
                        </Link>

                        <p className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
                          {project.siteCity}, {project.siteState}, NG &nbsp;←&nbsp; {project.ownerCity},{" "}
                          {project.ownerCountry} ({project.ownerName})
                        </p>

                        <p className="text-[15.5px] leading-[1.78] text-muted">{project.summary}</p>
                      </div>

                      {/* ARCHITECTURAL TELEMETRY MATRIX */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-dashed border-ink/20 pt-6 sm:grid-cols-3">
                        <div>
                          <p className="font-mono text-[9.5px] tracking-[0.16em] text-muted uppercase">Typology</p>
                          <p className="mt-1 font-sans text-sm font-medium text-ink">
                            {project.typology.split("·")[0]?.trim()}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[9.5px] tracking-[0.16em] text-muted uppercase">Gross Area</p>
                          <p className="mt-1 font-mono text-sm font-medium text-ink">
                            {project.areaSqm ?? 240} SQM · {project.durationWeeks ?? 20} WKS
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="font-mono text-[9.5px] tracking-[0.16em] text-muted uppercase">
                            Escrow Tranche
                          </p>
                          <p className="mt-1 font-mono text-sm font-medium text-ink">
                            {fmtUsd(project.totalUsdCents)}
                            <span className="ml-1.5 text-[11px] font-normal text-muted">
                              ({fmtNgn(project.totalNgn)})
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* STAGE COMPLETION BAR + CTA */}
                      <div className="space-y-4 border-t border-ink/10 pt-5">
                        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                          <span>
                            {project.settledStageCount} / {project.stageCount} Tranches Settled
                          </span>
                          <span>{pct}% Released</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {Array.from({ length: project.stageCount || 6 }, (_, i) => {
                            const settled = i < project.settledStageCount;
                            return (
                              <div
                                key={i}
                                className={`h-1.5 rounded-[1px] ${
                                  settled
                                    ? "bg-leaf"
                                    : !isCompleted && i === project.settledStageCount
                                      ? "bg-vermilion"
                                      : "bg-ink/15"
                                }`}
                              />
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-2">
                          <Link href={`/projects/${project.slug}`} className="btn">
                            Open Monograph →
                          </Link>
                          {project.nearProjectId === "hb-akobo-bungalow-v2" && (
                            <Link href="/build" className="btn-ghost">
                              Live Testnet Vault
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        /* TECHNICAL REGISTER VIEW: ARCA / MOSS KELD STRUCTURED TABLE */
        <section className="mx-auto max-w-[1340px] px-6 pb-28 md:px-10">
          <div className="overflow-x-auto border border-dashed border-ink/25 bg-card">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/20 bg-plaster/55 font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Project &amp; Plate</th>
                  <th className="px-5 py-4">Corridor</th>
                  <th className="px-5 py-4">Area</th>
                  <th className="px-5 py-4">Stages</th>
                  <th className="px-5 py-4">Volume</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-ink/15">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition hover:bg-paper/75">
                    <td className="px-5 py-5 font-mono text-xs font-semibold text-vermilion">{p.code}</td>
                    <td className="px-5 py-5">
                      <Link href={`/projects/${p.slug}`} className="flex items-center gap-4 group">
                        <div className="relative h-14 w-22 shrink-0 overflow-hidden border border-ink/20 bg-plaster">
                          <Image src={p.heroImage} alt={p.name} fill sizes="88px" className="object-cover" />
                        </div>
                        <div>
                          <div className="font-sans text-base font-medium text-ink group-hover:text-vermilion">
                            {p.name}
                          </div>
                          <div className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
                            {p.typology}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-5 font-mono text-xs text-ink">
                      {p.siteCity} ← {p.ownerCity}, {p.ownerCountry}
                    </td>
                    <td className="px-5 py-5 font-mono text-xs text-muted">{p.areaSqm ?? "—"} sqm</td>
                    <td className="px-5 py-5 font-mono text-xs text-ink">
                      {p.settledStageCount} / {p.stageCount}
                    </td>
                    <td className="px-5 py-5 font-mono text-xs font-medium text-ink">
                      {fmtUsd(p.totalUsdCents)}
                    </td>
                    <td className="px-5 py-5">
                      {p.completionStatus === "completed" ? (
                        <span className="font-mono text-[10px] tracking-[0.14em] text-leaf uppercase">
                          ● Settled {p.completedYear}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">
                          ● Live Stage 03
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-5 text-right">
                      <Link
                        href={`/projects/${p.slug}`}
                        className="font-mono text-[11px] tracking-[0.14em] text-ink underline decoration-ink/35 underline-offset-4 hover:text-vermilion"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
