import { notFound } from "next/navigation";
import { PlatformWorkspace, platformSections, type PlatformSection } from "@/components/platform-workspace";
import { ProtectedRoute } from "@/components/protected-route";

export function generateStaticParams() {
  return platformSections.map((section) => ({ section }));
}

export default async function PlatformPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!platformSections.includes(section as PlatformSection)) notFound();

  return <ProtectedRoute><PlatformWorkspace section={section as PlatformSection} /></ProtectedRoute>;
}
