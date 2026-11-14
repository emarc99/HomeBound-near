import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProjectMonographView } from "@/components/projects/ProjectMonographView";
import { getPortfolioProjectBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPortfolioProjectBySlug(slug);
  if (!project) {
    return { title: "Project Not Found — HomeBound" };
  }
  return {
    title: `${project.name} (${project.siteCity}) — HomeBound Monograph`,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPortfolioProjectBySlug(slug);
  if (!project) notFound();

  return (
    <>
      <Header wallet={false} />
      <main className="flex-1 bg-paper">
        <ProjectMonographView project={project} />
      </main>
    </>
  );
}
