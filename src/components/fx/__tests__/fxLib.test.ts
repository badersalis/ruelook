import { describe, expect, it } from "vitest";
import { buildConnectors } from "@/lib/fx/connectors";
import { flyToBag } from "@/lib/fx/flyToBag";
import { isCaptureMode } from "@/lib/fx/capture";
import { lookSeed } from "@/lib/fx/rng";
import { staggerDelay } from "@/lib/fx/motion";
import { mockMatchMedia } from "./matchMedia";

const anchor = { x: 300, y: 40, w: 300, h: 420, tileH: 375 };
const items = [
  { x: 60, y: 40, w: 200, h: 300, tileH: 250 },
  { x: 640, y: 40, w: 200, h: 300, tileH: 250 },
];

describe("fx lib", () => {
  it("connectors are deterministic for a seed and differ between looks", () => {
    const a = buildConnectors(anchor, items, lookSeed(0));
    const b = buildConnectors(anchor, items, lookSeed(0));
    const c = buildConnectors(anchor, items, lookSeed(1));
    expect(a).toEqual(b);
    expect(a.map((x) => x.d)).not.toEqual(c.map((x) => x.d));
    expect(a[0]?.d.startsWith("M294 ")).toBe(true); // left item attaches 6px off the anchor's left edge
  });

  it("stagger is capped at motion.stagger-max", () => {
    expect(staggerDelay(2)).toBe(120);
    expect(staggerDelay(12)).toBe(360);
  });

  it("flyToBag is a no-op under reduced motion", () => {
    mockMatchMedia({ reducedMotion: true });
    const bag = document.createElement("button");
    bag.setAttribute("data-bag-target", "");
    document.body.appendChild(bag);
    const from = document.createElement("div");
    document.body.appendChild(from);
    flyToBag(from, "/x.webp");
    expect(document.body.querySelectorAll("img")).toHaveLength(0);
    expect(bag.classList.contains("bag-bounce")).toBe(false);
    bag.remove();
    from.remove();
  });

  it("reads capture mode from the query string", () => {
    window.history.replaceState(null, "", "/?capture=1");
    expect(isCaptureMode()).toBe(true);
    window.history.replaceState(null, "", "/");
    expect(isCaptureMode()).toBe(false);
  });
});
