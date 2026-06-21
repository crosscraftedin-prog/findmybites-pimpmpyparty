import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS } from "@/lib/constants";
import { AdminPanelPage } from "./AdminPanelPage";

export const dynamic = "force-dynamic";

export default async function AdminRoute() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    redirect("/");
  }

  const isAdmin = ADMIN_EMAILS.some(
    (e) => e.toLowerCase() === session.user.email!.toLowerCase()
  );

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminPanelPage adminEmail={session.user.email} adminName={session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Admin"} />;
}
