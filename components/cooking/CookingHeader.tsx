import CookingNav from "./CookingNav";

export default function CookingHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-orange-400/15 bg-gradient-to-br from-orange-500/15 via-amber-500/5 to-transparent p-6">
        <div className="absolute -right-4 -top-8 text-8xl opacity-10" aria-hidden>🍳</div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-400">Cooking</p>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">{description}</p>
      </div>
      <CookingNav />
    </div>
  );
}
