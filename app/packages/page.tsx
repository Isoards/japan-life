import PackagesClient from "./PackagesClient";

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  return <PackagesClient initialShowForm={add === "1"} />;
}
