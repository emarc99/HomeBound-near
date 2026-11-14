"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CadFrame } from "@/components/landing/CadPrimitives";
import type { PortfolioProjectDetail, PortfolioStageRow } from "@/lib/queries";

function fmtUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtNgn(ngn: number) {
  return `₦${ngn.toLocaleString("en-US")}`;
}

function StageStatusBadge({ status, nearStatus }: { status: string; nearStatus: string | null }) {
  const effective = nearStatus ?? status;
  if (status === "paid" || effective === "released") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-leaf/35 bg-mint/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-leaf uppercase">
        ● Settled
      </span>
    );
  }
  if (status === "funded" || effective === "funded" || effective === "submitted") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-vermilion/35 bg-vermilion/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">
        ● Active / Funded
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-ink/20 bg-plaster px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
      ○ Planned
    </span>
  );
}

function ArchitecturalSpecsTable({ project }: { project: PortfolioProjectDetail }) {
  const rows = [
    { label: "Commission Corridor", value: `${project.ownerCity}, ${project.ownerCountry} → ${project.siteCity}, NG` },
    { label: "Homeowner", value: project.ownerName },
    { label: "General Contractor", value: project.contractorName },
    { label: "Site Foreman", value: project.foremanName },
    { label: "Coordinates", value: `${project.siteLat.toFixed(4)}° N, ${project.siteLng.toFixed(4)}° E` },
    { label: "Floor Area & Span", value: `${project.areaSqm ?? 240} SQM · ${project.durationWeeks ?? 20} Weeks` },
    { label: "Architectural Lead", value: project.specs?.architect ?? "HomeBound Studio Partner" },
    { label: "Structural Engineer", value: project.specs?.structuralEngineer ?? "Regional Structural Lead" },
    { label: "Envelope Material", value: project.specs?.facadeMaterial ?? "Reinforced masonry" },
    { label: "Climate Strategy", value: project.specs?.climateStrategy ?? "Cross-ventilated passive shading" },
    { label: "NEAR Contract Scope", value: project.nearProjectId ?? "escrow.homebound-hq.testnet" },
  ];

  return (
    <div className="border border-dashed border-ink/25 bg-card">
      <div className="border-b border-dashed border-ink/20 px-5 py-3.5">
        <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
          Specification Dossier · {project.code}
        </p>
      </div>
      <dl className="divide-y divide-dashed divide-ink/15">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-12 gap-2 px-5 py-3 text-xs">
            <dt className="col-span-5 font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              {r.label}
            </dt>
            <dd className="col-span-7 text-right font-sans font-medium text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function StageLedgerSection({ stages }: { stages: PortfolioStageRow[] }) {
  return (
    <section className="mx-auto max-w-[1340px] px-6 py-20 md:px-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-dashed border-ink/20 pb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
            + ESCROW SCHEDULE · STAGE-BY-STAGE CRITERIA &amp; USDC RELEASES
          </p>
          <h2 className="mt-3 font-sans text-3xl font-medium tracking-[-0.03em] text-ink">
            Milestone Verification &amp; Payment Trail
          </h2>
        </div>
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
          Each tranche hashes physical criteria before NEAR settlement
        </p>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="grid gap-6 border border-dashed border-ink/25 bg-card p-6 transition hover:border-ink/45 md:grid-cols-12 md:items-center"
          >
            <div className="md:col-span-5 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs font-semibold text-vermilion">
                  STAGE {String(stage.seq).padStart(2, "0")}
                </span>
                <StageStatusBadge status={stage.status} nearStatus={stage.nearStatus} />
                <span className="font-mono text-[10px] text-muted uppercase">
                  {stage.durationDays} days
                </span>
              </div>
              <h3 className="font-sans text-xl font-medium tracking-[-0.02em] text-ink">
                {stage.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted">{stage.description}</p>
            </div>

            <div className="md:col-span-4 space-y-2 border-t border-dashed border-ink/15 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6">
              <p className="font-mono text-[9.5px] tracking-[0.16em] text-muted uppercase">
                Attested Acceptance Criteria
              </p>
              <p className="text-xs leading-relaxed text-ink">{stage.acceptanceCriteria}</p>
              <p className="font-mono text-[10px] text-muted truncate">
                criteria_hash: {stage.criteriaHash.slice(0, 20)}…
              </p>
            </div>

            <div className="md:col-span-3 flex flex-col justify-between gap-3 border-t border-dashed border-ink/15 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6 md:text-right">
              <div>
                <p className="font-mono text-[9.5px] tracking-[0.16em] text-muted uppercase">
                  Labor Tranche
                </p>
                <p className="mt-1 font-sans text-2xl font-medium tracking-[-0.02em] text-ink">
                  {fmtUsd(stage.laborTrancheUsdCents)}
                  <span className="ml-1.5 font-mono text-[10px] font-normal text-muted">USDC</span>
                </p>
                <p className="font-mono text-[11px] text-muted">{fmtNgn(stage.laborNgn)} est.</p>
              </div>
              {stage.releaseTxHash ? (
                <a
                  href={`https://testnet.nearblocks.io/txns/${stage.releaseTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] tracking-[0.12em] text-vermilion underline decoration-vermilion/40 underline-offset-4 hover:text-ink"
                >
                  Receipt {stage.releaseTxHash.slice(0, 10)}… ↗
                </a>
              ) : stage.fundTxHash ? (
                <a
                  href={`https://testnet.nearblocks.io/txns/${stage.fundTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[10px] tracking-[0.12em] text-ink underline decoration-ink/35 underline-offset-4 hover:text-vermilion"
                >
                  Funded {stage.fundTxHash.slice(0, 10)}… ↗
                </a>
              ) : (
                <span className="font-mono text-[10px] text-muted uppercase">
                  Awaiting tranche funding
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProjectMonographView({ project }: { project: PortfolioProjectDetail }) {
  const [plateModal, setPlateModal] = useState<{ src: string; caption: string } | null>(null);
  const [arcaPlateMode, setArcaPlateMode] = useState<"perspective" | "blueprint" | "split">("split");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlateModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const heroCap = project.specs?.plates.heroCaption ?? `${project.code} · Primary Architectural Plate`;
  const sectionCap = project.specs?.plates.sectionCaption ?? `${project.code} · Section & Plan Sheet`;
  const detailCap = project.specs?.plates.detailCaption ?? `${project.code} · Tectonic Material Study`;

  const renderVariantBody = () => {
    // 1. HART OLIVEIRA "CASA DO MURO" EDITORIAL MONOGRAPH LAYOUT
    if (project.layoutVariant === "monograph") {
      return (
        <>
          <section className="mx-auto max-w-[1340px] px-6 py-16 md:px-10 md:py-24">
            <div className="grid gap-10 md:grid-cols-12 md:items-start lg:gap-14">
              {/* Left 4-col sticky architectural dossier */}
              <div className="md:col-span-4 md:sticky md:top-24 space-y-6">
                <ArchitecturalSpecsTable project={project} />
                <div className="border border-dashed border-ink/20 bg-paper p-5">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                    Elevation Datum Register
                  </p>
                  <p className="mt-2 font-mono text-xs text-ink">
                    {project.specs?.elevationDatum}
                  </p>
                </div>
              </div>

              {/* Right 8-col spacious plate & editorial essays */}
              <div className="md:col-span-8 space-y-16">
                <p className="font-sans text-xl leading-[1.7] text-ink md:text-[1.45rem]">
                  {project.architecturalBrief}
                </p>

                <button
                  type="button"
                  onClick={() => setPlateModal({ src: project.heroImage, caption: heroCap })}
                  className="block w-full text-left cursor-zoom-in group"
                >
                  <CadFrame className="bg-card p-3 md:p-4">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-plaster">
                      <Image
                        src={project.heroImage}
                        alt={heroCap}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        priority
                        className="object-cover transition duration-700 group-hover:scale-[1.015]"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                      <span>{heroCap}</span>
                      <span className="text-vermilion">Inspect Full Sheet ↗</span>
                    </div>
                  </CadFrame>
                </button>

                <div className="grid gap-10 border-y border-dashed border-ink/20 py-12 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                      01 · Spatial &amp; Microclimate Strategy
                    </p>
                    <p className="text-[15.5px] leading-[1.8] text-muted">{project.spatialNotes}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                      02 · Tectonics &amp; Structural Execution
                    </p>
                    <p className="text-[15.5px] leading-[1.8] text-muted">{project.structuralNotes}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Wide Two-Sheet Orthographic Drawing Spread */}
          <section className="border-y border-dashed border-ink/20 bg-card/65 py-20">
            <div className="mx-auto max-w-[1340px] px-6 md:px-10">
              <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
                <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                  + DRAWING SPREAD · ORTHOGRAPHIC SECTION &amp; DAYLIGHT STUDY
                </p>
                <span className="font-mono text-[10px] tracking-[0.15em] text-muted uppercase">
                  Click any drawing plate to enlarge
                </span>
              </div>
              <div className="grid gap-8 md:grid-cols-12">
                <button
                  type="button"
                  onClick={() => setPlateModal({ src: project.sectionImage, caption: sectionCap })}
                  className="md:col-span-7 block text-left cursor-zoom-in group"
                >
                  <CadFrame className="bg-paper p-3">
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image
                        src={project.sectionImage}
                        alt={sectionCap}
                        fill
                        sizes="(max-width: 1024px) 100vw, 58vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.01]"
                      />
                    </div>
                    <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                      {sectionCap}
                    </p>
                  </CadFrame>
                </button>

                <button
                  type="button"
                  onClick={() => setPlateModal({ src: project.detailImage, caption: detailCap })}
                  className="md:col-span-5 block text-left cursor-zoom-in group"
                >
                  <CadFrame className="bg-paper p-3 h-full flex flex-col justify-between">
                    <div className="relative aspect-[14/10] w-full overflow-hidden">
                      <Image
                        src={project.detailImage}
                        alt={detailCap}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.01]"
                      />
                    </div>
                    <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                      {detailCap}
                    </p>
                  </CadFrame>
                </button>
              </div>
            </div>
          </section>
        </>
      );
    }

    // 2. MOSS KELD TOPOGRAPHIC DIPTYCH LAYOUT (Villa Udoka Enugu)
    if (project.layoutVariant === "diptych") {
      return (
        <>
          <section className="mx-auto max-w-[1340px] px-6 py-16 md:px-10 md:py-24">
            <div className="grid gap-10 md:grid-cols-12 md:items-stretch">
              <button
                type="button"
                onClick={() => setPlateModal({ src: project.heroImage, caption: heroCap })}
                className="md:col-span-8 block text-left cursor-zoom-in group"
              >
                <CadFrame className="bg-card p-3 h-full flex flex-col justify-between">
                  <div className="relative aspect-[16/10] w-full overflow-hidden">
                    <Image
                      src={project.heroImage}
                      alt={heroCap}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.015]"
                    />
                  </div>
                  <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                    {heroCap}
                  </p>
                </CadFrame>
              </button>

              {/* Vertical Elevation Datum Column */}
              <div className="md:col-span-4 flex flex-col justify-between border border-dashed border-ink/25 bg-card p-6 md:p-8">
                <div className="space-y-4">
                  <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                    Escarpment Elevation Datum
                  </p>
                  <div className="space-y-4 border-l-2 border-vermilion pl-5 pt-2">
                    {[
                      { level: "+6.80 m", title: "Cantilevered Roof Plane", note: "4.4 m west soffit" },
                      { level: "+3.40 m", title: "Teak Louver Sleeping Deck", note: "5 bedrooms · private loggia" },
                      { level: "+0.00 m", title: "Arrival & Atrium Gallery", note: "Board-formed shear core" },
                      { level: "-3.10 m", title: "Retaining Plinth & Garden", note: "14 augered geo-piles" },
                    ].map((d) => (
                      <div key={d.level}>
                        <p className="font-mono text-xs font-semibold text-ink">{d.level}</p>
                        <p className="text-sm font-medium text-ink">{d.title}</p>
                        <p className="font-mono text-[10px] text-muted uppercase">{d.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-dashed border-ink/20 pt-5 space-y-2">
                  <p className="font-mono text-[10px] text-muted uppercase">Corridor &amp; Builder</p>
                  <p className="text-sm font-medium text-ink">
                    {project.ownerName} · {project.contractorName}
                  </p>
                </div>
              </div>
            </div>

            {/* Panoramic Blueprint Sheet Full-Bleed */}
            <div className="mt-16">
              <button
                type="button"
                onClick={() => setPlateModal({ src: project.sectionImage, caption: sectionCap })}
                className="block w-full text-left cursor-zoom-in group"
              >
                <CadFrame className="bg-paper p-4">
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image
                      src={project.sectionImage}
                      alt={sectionCap}
                      fill
                      sizes="100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.01]"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
                    <span>{sectionCap}</span>
                    <span className="text-vermilion">Inspect Section B-B ↗</span>
                  </div>
                </CadFrame>
              </button>
            </div>

            {/* Atrium Detail + Spacious Narrative Spread */}
            <div className="mt-16 grid gap-12 md:grid-cols-12 md:items-center">
              <div className="md:col-span-6 space-y-8">
                <p className="font-sans text-xl leading-[1.68] text-ink">{project.architecturalBrief}</p>
                <p className="text-[15.5px] leading-[1.8] text-muted">{project.spatialNotes}</p>
                <p className="text-[15.5px] leading-[1.8] text-muted">{project.structuralNotes}</p>
              </div>
              <div className="md:col-span-6 space-y-6">
                <button
                  type="button"
                  onClick={() => setPlateModal({ src: project.detailImage, caption: detailCap })}
                  className="block w-full text-left cursor-zoom-in"
                >
                  <CadFrame className="bg-card p-3">
                    <div className="relative aspect-[14/9] w-full overflow-hidden">
                      <Image src={project.detailImage} alt={detailCap} fill sizes="50vw" className="object-cover" />
                    </div>
                    <p className="mt-2 font-mono text-[10px] text-muted uppercase">{detailCap}</p>
                  </CadFrame>
                </button>
                <ArchitecturalSpecsTable project={project} />
              </div>
            </div>
          </section>
        </>
      );
    }

    // 3. ARCA SWISS SPATIAL GRID & PLATE SWITCHER (Iyaganku GRA Pavilion)
    if (project.layoutVariant === "arca-grid") {
      return (
        <section className="mx-auto max-w-[1340px] px-6 py-16 md:px-10 md:py-24 space-y-16">
          {/* Interactive Perspective vs Structural Blueprint Switcher */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-dashed border-ink/20 pb-4">
              <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                + SPATIAL DECK · PHOTOGRAPHIC PERSPECTIVE VS AXONOMETRIC BLUEPRINT
              </p>
              <div className="flex items-center gap-2">
                {(
                  [
                    { id: "split", label: "Side-by-Side" },
                    { id: "perspective", label: "Perspective" },
                    { id: "blueprint", label: "Steel Blueprint" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setArcaPlateMode(m.id)}
                    className={`cursor-pointer rounded-[2px] px-3.5 py-1.5 font-mono text-[10px] tracking-[0.14em] uppercase transition ${
                      arcaPlateMode === m.id
                        ? "bg-vermilion text-[#f5f4f0]"
                        : "border border-ink/20 bg-card text-ink hover:border-ink"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {arcaPlateMode === "split" ? (
              <div className="grid gap-8 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPlateModal({ src: project.heroImage, caption: heroCap })}
                  className="block text-left cursor-zoom-in"
                >
                  <CadFrame className="bg-card p-3">
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image src={project.heroImage} alt={heroCap} fill priority sizes="50vw" className="object-cover" />
                    </div>
                    <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">{heroCap}</p>
                  </CadFrame>
                </button>
                <button
                  type="button"
                  onClick={() => setPlateModal({ src: project.sectionImage, caption: sectionCap })}
                  className="block text-left cursor-zoom-in"
                >
                  <CadFrame className="bg-blueprint p-3 text-[#edece8]">
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image src={project.sectionImage} alt={sectionCap} fill sizes="50vw" className="object-cover" />
                    </div>
                    <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-[#b5b2a8] uppercase">
                      {sectionCap}
                    </p>
                  </CadFrame>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPlateModal({
                    src: arcaPlateMode === "perspective" ? project.heroImage : project.sectionImage,
                    caption: arcaPlateMode === "perspective" ? heroCap : sectionCap,
                  })
                }
                className="block w-full text-left cursor-zoom-in"
              >
                <CadFrame
                  className={`p-4 ${arcaPlateMode === "blueprint" ? "bg-blueprint text-[#edece8]" : "bg-card"}`}
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image
                      src={arcaPlateMode === "perspective" ? project.heroImage : project.sectionImage}
                      alt={arcaPlateMode === "perspective" ? heroCap : sectionCap}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-3 font-mono text-[10px] tracking-[0.14em] uppercase opacity-75">
                    {arcaPlateMode === "perspective" ? heroCap : sectionCap}
                  </p>
                </CadFrame>
              </button>
            )}
          </div>

          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-7 space-y-8">
              <p className="font-sans text-2xl leading-[1.55] tracking-[-0.02em] text-ink">
                {project.architecturalBrief}
              </p>
              <div className="grid gap-8 sm:grid-cols-2 border-t border-dashed border-ink/20 pt-8">
                <div>
                  <h3 className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                    Canopy Siting
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{project.spatialNotes}</p>
                </div>
                <div>
                  <h3 className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                    Portal Engineering
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{project.structuralNotes}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlateModal({ src: project.detailImage, caption: detailCap })}
                className="block w-full text-left cursor-zoom-in"
              >
                <CadFrame className="bg-card p-3">
                  <div className="relative aspect-[14/9] w-full overflow-hidden">
                    <Image src={project.detailImage} alt={detailCap} fill sizes="60vw" className="object-cover" />
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-muted uppercase">{detailCap}</p>
                </CadFrame>
              </button>
            </div>
            <div className="md:col-span-5">
              <ArchitecturalSpecsTable project={project} />
            </div>
          </div>
        </section>
      );
    }

    // 4 & 5. ATELIER FRIEZE (Chevron Lekki) & LIVE ESCROW MONOGRAPH (Akobo Bungalow)
    return (
      <section className="mx-auto max-w-[1340px] px-6 py-16 md:px-10 md:py-24 space-y-20">
        {project.layoutVariant === "live-escrow" && (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-vermilion/40 bg-vermilion/8 p-6">
            <div>
              <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
                ● ACTIVE TESTNET CONTRACT · {project.nearProjectId}
              </p>
              <p className="mt-1 font-sans text-lg font-medium text-ink">
                This portfolio work is live on NEAR Testnet right now — inspect the escrow vault or test the gasless foreman camera.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/build" className="btn-pop">
                Open Escrow Vault (/build)
              </Link>
              <Link href="/site" className="btn-ghost">
                Site Camera (/site)
              </Link>
              <Link href="/verify" className="btn-ghost">
                Ledger (/verify)
              </Link>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setPlateModal({ src: project.heroImage, caption: heroCap })}
          className="block w-full text-left cursor-zoom-in"
        >
          <CadFrame className="bg-card p-3 md:p-5">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-plaster">
              <Image src={project.heroImage} alt={heroCap} fill priority sizes="100vw" className="object-cover" />
            </div>
            <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">{heroCap}</p>
          </CadFrame>
        </button>

        {/* Alternating Spatial Narrative + Section Sheet */}
        <div className="grid gap-14 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5 space-y-6">
            <p className="font-mono text-[10px] tracking-[0.16em] text-vermilion uppercase">
              + DESIGN THESIS · ENVIRONMENTAL &amp; STRUCTURAL BRIEF
            </p>
            <p className="font-sans text-xl leading-[1.7] text-ink">{project.architecturalBrief}</p>
            <p className="text-[15px] leading-[1.8] text-muted">{project.spatialNotes}</p>
            <p className="text-[15px] leading-[1.8] text-muted">{project.structuralNotes}</p>
          </div>
          <div className="md:col-span-7">
            <button
              type="button"
              onClick={() => setPlateModal({ src: project.sectionImage, caption: sectionCap })}
              className="block w-full text-left cursor-zoom-in"
            >
              <CadFrame className="bg-card p-3">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-plaster">
                  <Image src={project.sectionImage} alt={sectionCap} fill sizes="60vw" className="object-cover" />
                </div>
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">{sectionCap}</p>
              </CadFrame>
            </button>
          </div>
        </div>

        {/* Lower Split: Tectonic Detail + Dossier */}
        <div className="grid gap-12 md:grid-cols-12 md:items-start">
          <div className="md:col-span-6">
            <button
              type="button"
              onClick={() => setPlateModal({ src: project.detailImage, caption: detailCap })}
              className="block w-full text-left cursor-zoom-in"
            >
              <CadFrame className="bg-card p-3">
                <div className="relative aspect-[14/9] w-full overflow-hidden bg-plaster">
                  <Image src={project.detailImage} alt={detailCap} fill sizes="50vw" className="object-cover" />
                </div>
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">{detailCap}</p>
              </CadFrame>
            </button>
          </div>
          <div className="md:col-span-6">
            <ArchitecturalSpecsTable project={project} />
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="overflow-x-hidden bg-paper text-ink">
      {/* MONUMENTAL MONOGRAPH TOP HEADER */}
      <header className="border-b border-dashed border-ink/20 bg-card/55">
        <div className="mx-auto max-w-[1340px] px-6 pt-12 pb-16 md:px-10 md:pt-16 md:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-ink uppercase hover:text-vermilion"
            >
              ← Back to Selected Works
            </Link>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
                MONOGRAPH · {project.code}
              </span>
              {project.completionStatus === "completed" ? (
                <span className="rounded-[2px] border border-leaf/35 bg-mint/70 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-leaf uppercase">
                  ● Completed · {project.completedYear}
                </span>
              ) : (
                <span className="rounded-[2px] border border-vermilion/35 bg-vermilion/10 px-3 py-1 font-mono text-[10px] tracking-[0.14em] text-vermilion uppercase">
                  ● In Progress · Stage 03 Active
                </span>
              )}
            </div>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <p className="font-mono text-[11px] tracking-[0.16em] text-vermilion uppercase">
                {project.typology} · {project.siteCity}, {project.siteState}, Nigeria
              </p>
              <h1 className="mt-3 font-sans text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.04] font-medium tracking-[-0.04em] text-ink">
                {project.name}
              </h1>
            </div>
            <div className="md:col-span-4 grid grid-cols-2 gap-4 border-t border-dashed border-ink/20 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8">
              <div>
                <p className="font-mono text-[9.5px] tracking-[0.16em] text-muted uppercase">Escrow Settled</p>
                <p className="mt-1 font-sans text-2xl font-medium text-ink">
                  {fmtUsd(project.settledUsdCents)}
                  <span className="ml-1 font-mono text-[10px] font-normal text-muted">
                    / {fmtUsd(project.totalUsdCents)}
                  </span>
                </p>
              </div>
              <div>
                <p className="font-mono text-[9.5px] tracking-[0.16em] text-muted uppercase">Stages Released</p>
                <p className="mt-1 font-sans text-2xl font-medium text-ink">
                  {project.settledStageCount}
                  <span className="text-muted"> / {project.stageCount}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* VARIANT-SPECIFIC ARCHITECTURAL LAYOUT */}
      {renderVariantBody()}

      {/* DATABASE-BACKED STAGE SCHEDULE & RECEIPTS */}
      <div className="border-t border-dashed border-ink/20 bg-paper">
        <StageLedgerSection stages={project.stages} />
      </div>

      {/* NEXT / PREVIOUS MONOGRAPH PAGINATION */}
      {(project.prevProject || project.nextProject) && (
        <nav
          aria-label="Adjacent project monographs"
          className="border-t border-dashed border-ink/25 bg-card"
        >
          <div className="mx-auto grid max-w-[1340px] md:grid-cols-2 md:divide-x md:divide-dashed md:divide-ink/20">
            {project.prevProject ? (
              <Link
                href={`/projects/${project.prevProject.slug}`}
                className="group block px-6 py-12 transition hover:bg-paper md:px-10"
              >
                <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  ← Previous Monograph · {project.prevProject.code}
                </p>
                <p className="mt-2 font-sans text-2xl font-medium tracking-[-0.02em] text-ink group-hover:text-vermilion">
                  {project.prevProject.name}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted uppercase">
                  {project.prevProject.siteCity}, NG
                </p>
              </Link>
            ) : (
              <div />
            )}

            {project.nextProject && (
              <Link
                href={`/projects/${project.nextProject.slug}`}
                className="group block border-t border-dashed border-ink/20 px-6 py-12 text-left transition hover:bg-paper md:border-t-0 md:px-10 md:text-right"
              >
                <p className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                  Next Monograph · {project.nextProject.code} →
                </p>
                <p className="mt-2 font-sans text-2xl font-medium tracking-[-0.02em] text-ink group-hover:text-vermilion">
                  {project.nextProject.name}
                </p>
                <p className="mt-1 font-mono text-[11px] text-muted uppercase">
                  {project.nextProject.siteCity}, NG
                </p>
              </Link>
            )}
          </div>
        </nav>
      )}

      {/* HIGH-RESOLUTION ARCHITECTURAL PLATE MODAL */}
      {plateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/82 p-4 backdrop-blur-xs md:p-10"
          onClick={() => setPlateModal(null)}
        >
          <div
            className="w-full max-w-6xl border border-ink/40 bg-paper p-4 shadow-2xl md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between border-b border-dashed border-ink/20 pb-3">
              <span className="font-mono text-[11px] tracking-[0.15em] text-ink uppercase">
                {plateModal.caption}
              </span>
              <button
                type="button"
                onClick={() => setPlateModal(null)}
                className="cursor-pointer rounded-[2px] border border-ink/25 bg-card px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase hover:bg-ink hover:text-paper"
              >
                Close [ESC]
              </button>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-plaster">
              <Image src={plateModal.src} alt={plateModal.caption} fill sizes="95vw" className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
