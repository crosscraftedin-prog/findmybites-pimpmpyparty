import { getCakePage, generateCakeMetadata } from "@/lib/cake-pages";
import { CakeLanding } from "@/components/seo/CakeLanding";

const page = getCakePage("birthday-cakes-dubai")!;

export function generateMetadata() {
  return generateCakeMetadata(page);
}

export default function Page() {
  return <CakeLanding page={page} />;
}
