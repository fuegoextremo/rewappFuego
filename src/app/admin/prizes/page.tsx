
import { createAdminClient } from "@/lib/supabase/admin";
import PrizesClient from "./prizes-client";
import { getPrizeStats } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = createAdminClient();
  
  const [prizesResult, statsResult] = await Promise.all([
    supabase
      .from("prizes")
      .select("*")
      .is("deleted_at", null)  // ✅ Solo premios no eliminados
      .order("created_at", { ascending: false }),
    getPrizeStats()
  ]);

  return (
    <PrizesClient 
      prizes={prizesResult.data ?? []} 
      prizeStats={statsResult}
    />
  );
}
