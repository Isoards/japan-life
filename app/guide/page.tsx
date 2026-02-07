import GuideClient from "./GuideClient";
import guideContent from "@/data/guide-content.json";
import type { GuideSection } from "@/lib/types";

export default function GuidePage() {
  const sections = guideContent as GuideSection[];
  return <GuideClient sections={sections} />;
}
