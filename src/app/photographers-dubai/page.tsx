import { getKeywordPage, generateKeywordMetadata } from "@/lib/keyword-pages";
import { KeywordLanding } from "@/components/seo/keyword-landing";

const page = getKeywordPage("photographers-dubai")!;

export function generateMetadata() {
  return generateKeywordMetadata(page);
}

export default function Page() {
  return <KeywordLanding page={page} />;
}
