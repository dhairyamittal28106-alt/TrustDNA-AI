import { notFound } from "next/navigation";
import { PlatformWorkspace, platformSections, type PlatformSection } from "@/components/platform-workspace";

export function generateStaticParams() {
  return platformSections.map((section) => ({ section }));
}

export default async function PlatformPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!platformSections.includes(section as PlatformSection)) notFound();

  return <PlatformWorkspace section={section as PlatformSection} />;
}
