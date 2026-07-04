import { getKeywordPage, generateKeywordMetadata } from "@/lib/keyword-pages";
import { KeywordLanding } from "@/components/seo/keyword-landing";

const page = getKeywordPage("wedding-cakes-london")!;

export function generateMetadata() {
  return generateKeywordMetadata(page);
}

export default function Page() {
  return <KeywordLanding page={page} />;
}
