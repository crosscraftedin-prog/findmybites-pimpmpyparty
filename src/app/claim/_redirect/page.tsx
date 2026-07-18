import { redirect } from "next/navigation";

/**
 * /claim/[vendorId] — REDIRECTED to /dashboard
 *
 * The old direct-claim flow is replaced by the invite/activate flow.
 */
export default function ClaimRedirect({
  params,
}: {
  params: Promise<{ vendorId: string }>;
}) {
  redirect("/dashboard");
}
