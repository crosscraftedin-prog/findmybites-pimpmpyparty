import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/**
 * /search — Search redirect page
 *
 * Josh AI and other components link to /search?category=...&city=...
 * This page redirects to the homepage with the explore section,
 * preserving the query params so the client-side search can pick them up.
 *
 * Alternatively, if a dedicated search experience is needed in the future,
 * this page can be expanded into a full search results page.
 */
export default function SearchPage(req: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Redirect to homepage with query params preserved
  // The homepage's BrowseSection (#explore) reads these params
  return redirect("/?explore=1");
}
