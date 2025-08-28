
import { createAdminClient } from "@/lib/supabase/admin";
import PrizesClient from "./prizes-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = createAdminClient();
  
  const { data: prizes } = await supabase
    .from("prizes")
    .select("*")
    .order("created_at", { ascending: false });

  return <PrizesClient prizes={prizes ?? []} />;
}
