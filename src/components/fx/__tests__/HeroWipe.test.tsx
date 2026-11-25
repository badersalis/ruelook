import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import HeroWipe from "../HeroWipe";
import type { HeroSlide } from "@/lib/types";
import { mockMatchMedia } from "./matchMedia";

const slides: HeroSlide[] = [
  {
    id: "s1",
    kicker: "New season",
    lines: ["Lagos", "in blue"],
    sub: "Denim cut for heat.",
    cta: { label: "Shop the drop", href: "/shop/" },
    image: { src960: "/campaign/hero-01-960.webp", src1600: "/campaign/hero-01-1600.webp", alt: "Model in denim" },
  },
  {
    id: "s2",
    kicker: "Street",
    lines: ["Leather", "after dark"],
    sub: "Boots and bags.",
    cta: { label: "Shop the drop", href: "/shop/?category=shoes" },
    image: { src960: "/campaign/hero-02-960.webp", src1600: "/campaign/hero-02-1600.webp", alt: "" },
  },
  {
    id: "s3",
    kicker: "Weekend",
    lines: ["Walk", "the city"],
    sub: "Light layers.",
    cta: { label: "Shop the drop", href: "/shop/?category=men" },
    image: { src960: "/campaign/hero-03-960.webp", src1600: "/campaign/hero-03-1600.webp", alt: "" },
    focal: "60% 40%",
  },
];

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("HeroWipe", () => {
  it("renders every slide headline as a heading inside a labelled slide group", () => {
    mockMatchMedia();
    render(<HeroWipe slides={slides} />);
    expect(screen.getByRole("region", { name: "New season campaign" })).toHaveAttribute(
      "aria-roledescription",
      "carousel",
    );
    slides.forEach((s, i) => {
      const group = screen.getByRole("group", { name: `${i + 1} of 3` });
      expect(group).toHaveAttribute("aria-roledescription", "slide");
      const heading = within(group).getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent(s.lines.join(" "));
      // next/link drops the trailing slash under Vitest (trailingSlash is a build-time flag).
      const href = within(group).getByRole("link", { name: "Shop the drop" }).getAttribute("href");
      expect(href?.replace(/\/(?=\?|$)/, "")).toBe(s.cta.href.replace(/\/(?=\?|$)/, ""));
    });
  });

  it("server-renders slide 1's image as a high-priority LCP image and defers the others", () => {
    mockMatchMedia();
    const { container } = render(<HeroWipe slides={slides} />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("fetchpriority", "high");
    expect(imgs[0]).not.toHaveAttribute("loading", "lazy");
    expect(imgs[0]?.getAttribute("srcset")).toContain("960w");
  });

  it("advances to the next slide with the Next button", async () => {
    mockMatchMedia();
    const user = userEvent.setup();
    render(<HeroWipe slides={slides} />);
    const first = screen.getByRole("group", { name: "1 of 3" });
    expect(first).toHaveAttribute("data-state", "active");
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    await waitFor(() =>
      expect(screen.getByRole("group", { name: "2 of 3" })).toHaveAttribute("data-state", "active"),
    );
    expect(first).toHaveAttribute("data-state", "idle");
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    await waitFor(() => expect(first).toHaveAttribute("data-state", "active"));
  });

  it("autoplays by default: Pause control shown, live region off", () => {
    mockMatchMedia({ reducedMotion: false });
    const { container } = render(<HeroWipe slides={slides} />);
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument();
    expect(container.querySelector(".fx-hero__slides")).toHaveAttribute("aria-live", "off");
  });

  it("disables autoplay under reduced motion, and reacts when the setting changes at runtime", async () => {
    const mm = mockMatchMedia({ reducedMotion: true });
    const { container } = render(<HeroWipe slides={slides} />);
    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeInTheDocument();
    expect(container.querySelector(".fx-hero__slides")).toHaveAttribute("aria-live", "polite");

    // User may still opt in explicitly...
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Play slideshow" }));
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeInTheDocument();

    // ...and a runtime switch back to reduced motion stops rotation again.
    act(() => mm.setReducedMotion(false));
    act(() => mm.setReducedMotion(true));
    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeInTheDocument();
  });

  it("does not autoplay in capture mode and exposes capture hooks", async () => {
    mockMatchMedia();
    window.history.replaceState(null, "", "/?capture=1");
    render(<HeroWipe slides={slides} />);
    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeInTheDocument();
    expect(window.__fxHero).toBeDefined();
    act(() => window.__fxHero?.goTo(2));
    await waitFor(() =>
      expect(screen.getByRole("group", { name: "3 of 3" })).toHaveAttribute("data-state", "active"),
    );
  });
});
