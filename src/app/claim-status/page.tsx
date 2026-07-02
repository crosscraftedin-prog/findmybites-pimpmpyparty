import { redirect } from "next/navigation";

/**
 * /claim-status — REDIRECTED to /dashboard
 *
 * Vendors no longer see a "claim status" page. After activation, they go
 * straight to the dashboard.
 */
export default function ClaimStatusRedirect() {
  redirect("/dashboard");
}
