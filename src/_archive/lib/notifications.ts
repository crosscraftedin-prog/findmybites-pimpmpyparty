/**
 * Archived on 2026-07-14
 * Reason: Zero runtime references found during production audit.
 * Preserved for future features.
 */
/**
 * Vendor plan expiry notifications.
 *
 * For now, just logs that an email SHOULD be sent. When an email service
 * (Resend, SendGrid, etc.) is configured, replace the console.log with
 * the actual send call.
 */

export interface ExpiryNotificationVendor {
  id: string;
  name: string;
  userEmail?: string | null;
  slug: string;
  plan?: string | null;
  planExpiresAt?: string | null;
}

/**
 * Notify a vendor that their plan is about to expire.
 * Called from the verify-payment endpoint (sets expiry) and potentially
 * from a cron job that checks all vendors daily.
 */
export async function notifyVendorExpiry(
  vendor: ExpiryNotificationVendor,
  daysLeft: number
): Promise<void> {
  const message = `
[NOTIFICATION] Plan expiry email should be sent:
  Vendor: ${vendor.name}
  Email: ${vendor.userEmail || "(no email)"}
  Slug: ${vendor.slug}
  Plan: ${vendor.plan || "unknown"}
  Days Left: ${daysLeft}
  Expires: ${vendor.planExpiresAt || "unknown"}
  Action: ${daysLeft <= 0 ? "EXPIRED — plan should be downgraded" : daysLeft <= 7 ? "URGENT — renew now" : "Warning — renew soon"}
`;

  console.log(message);

  // TODO: Integrate email service (Resend, SendGrid, etc.)
  // Example with Resend:
  //   import { Resend } from 'resend';
  //   const resend = new Resend(process.env.RESEND_API_KEY);
  //   await resend.emails.send({
  //     from: 'FindMyBites <hello@findmybites.party>',
  //     to: vendor.userEmail,
  //     subject: daysLeft <= 0 ? 'Your plan has expired' : `Your plan expires in ${daysLeft} days`,
  //     html: `<p>Hi ${vendor.name},</p><p>Your ${vendor.plan} plan ${daysLeft <= 0 ? 'has expired' : `expires in ${daysLeft} days`}. Renew now to keep your benefits.</p><a href="https://www.findmybites.com/dashboard">Renew →</a>`,
  //   });
}

/**
 * Check all vendors for expiring plans and send notifications.
 * Can be called from a cron job endpoint (when created).
 */
export async function checkExpiringPlans(): Promise<void> {
  // This would query all vendors with planExpiresAt set and call
  // notifyVendorExpiry for those within 30/7/0 days.
  // For now, it's a stub — implement when the cron endpoint is created.
  console.log("[notifications] checkExpiringPlans called — implement with DB query");
}
