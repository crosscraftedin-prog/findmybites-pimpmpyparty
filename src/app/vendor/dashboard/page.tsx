import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { VendorDashboardPage } from "./VendorDashboardPage";

export const dynamic = "force-dynamic";

export default async function VendorDashboardRoute() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <VendorDashboardPage
      userEmail={session.user.email}
      userName={
        (session.user.user_metadata?.full_name as string) ||
        session.user.email?.split("@")[0] ||
        "Vendor"
      }
      userImage={session.user.user_metadata?.avatar_url as string | undefined}
    />
  );
}
