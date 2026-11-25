import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
      <p className="eyebrow text-denim-700">404</p>
      <h1 className="font-display text-[36px] font-bold md:text-[56px]">Wrong turn off the high street</h1>
      <p className="max-w-md text-ink-soft">This page doesn&apos;t exist. The drop is still on, though.</p>
      <ButtonLink href="/shop/">Shop New Arrivals</ButtonLink>
    </div>
  );
}
