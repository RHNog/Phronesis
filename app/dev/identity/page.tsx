import { notFound } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import IdentityExplorer from "@/features/developer/identity/components/IdentityExplorer";
import { IdentityOrchestrator } from "@/lib/engines/identity/IdentityOrchestrator";

type IdentityDeveloperPageProps = {
  searchParams: Promise<{
    cardId?: string;
    q?: string;
  }>;
};

export default async function IdentityDeveloperPage({
  searchParams,
}: IdentityDeveloperPageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = await searchParams;
  const query = params.q ?? "";
  const response = await new IdentityOrchestrator().search(query);

  return (
    <AppShell requiredModule="ADMINISTRATION">
      <IdentityExplorer response={response} selectedCardId={params.cardId} />
    </AppShell>
  );
}
