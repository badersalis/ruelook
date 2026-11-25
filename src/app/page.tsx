import { HeroWipe } from "@/components/fx/HeroWipe";
import { BagsBanner, NewArrivals, PromoBento } from "@/components/store/Home";
import { assetUrl } from "@/lib/config";
import type { HeroSlide } from "@/lib/types";

const img = (name: string, alt: string) => ({
  src960: assetUrl(`campaign/${name}-960.webp`),
  src1600: assetUrl(`campaign/${name}-1600.webp`),
  alt,
});

const slides: HeroSlide[] = [
  {
    id: "lagos-blue",
    kicker: "Drop 07 · Lagos edit",
    lines: ["The street is", "the runway."],
    sub: "Heavyweight basics, sharp boots and bags with somewhere to be.",
    cta: { label: "Shop the drop", href: "/shop/" },
    image: img("hero-01-lagos-blue", "A woman in a blue head wrap and flowing blue dress leaning on a yellow Lagos bus"),
    focal: "65% 40%",
  },
  {
    id: "street-leather",
    kicker: "Outerwear",
    lines: ["Layers that", "hold their own."],
    sub: "Jackets cut for the city, made to last more than a season.",
    cta: { label: "Shop men", href: "/shop/?category=men" },
    image: img("hero-02-street-leather", "A smiling young man in a black leather jacket over a denim shirt on a busy pedestrian street"),
    focal: "60% 35%",
  },
  {
    id: "lagos-walk",
    kicker: "Complete the look",
    lines: ["One piece in,", "full look out."],
    sub: "Our AI Stylist builds outfits around anything you love.",
    cta: { label: "Try the stylist", href: "/product/?slug=heavyweight-hoodie-black" },
    image: img("hero-03-lagos-walk", "A woman in a blue patterned head wrap, printed dress and long blue coat crossing a Lagos street"),
    focal: "70% 40%",
  },
];

export default function HomePage() {
  return (
    <>
      <HeroWipe slides={slides} />
      <NewArrivals />
      <PromoBento />
      <BagsBanner />
    </>
  );
}
