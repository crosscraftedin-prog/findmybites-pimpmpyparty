import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerDashboard } from "./customer-dashboard";

export const dynamic = "force-dynamic";

/**
 * /account — Customer dashboard.
 * Requires authentication (Google OAuth via Supabase).
 */
export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <CustomerDashboard
      userEmail={session.user.email}
      userName={session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Customer"}
      userImage={session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || ""}
    />
  );
}
