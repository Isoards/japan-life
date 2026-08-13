import { Suspense } from "react";
import DiscoverClient from "./DiscoverClient";

export default function DiscoverPage() {
  return <Suspense fallback={<div className="py-16 text-center text-sm text-gray-500">요리 목록을 준비하고 있어요...</div>}><DiscoverClient /></Suspense>;
}
