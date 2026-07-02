import { redirect } from "next/navigation";

/**
 * /claim-token/[token] — REDIRECTED to /activate/[token]
 *
 * Old invite links still work — they redirect to the clean /activate page.
 */
export default async function ClaimTokenRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/activate/${token}`);
}
