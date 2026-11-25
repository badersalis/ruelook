import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LookBoard, { AI_TOOLTIP, STYLIST_ERROR } from "../LookBoard";
import type { Look, ProductSummary } from "@/lib/types";
import { mockMatchMedia } from "./matchMedia";

function product(id: string, name: string, price: number, stock = 5): ProductSummary {
  return {
    id,
    slug: id,
    name,
    price_cents: price,
    created_at: "2026-11-01T00:00:00Z",
    category: { slug: "men", name: "Men" },
    images: [{ path: `static/catalog/${id}/1`, alt: `${name}, front view`, sort: 0 }],
    totalStock: stock,
  };
}

const current = product("ink-tee", "Heavy Tee, Ink", 3800);
const denim = product("straight-denim", "Straight Denim, Mid Blue", 7200);
const sneaker = product("low-top", "Low-top Sneaker, White", 9500, 0); // sold out
const tote = product("canvas-tote", "Canvas Tote, Sand", 2800);
const cap = product("cap-ink", "Six-panel Cap, Ink", 2400);
const runner = product("trail-runner", "Trail Runner, Slate", 11000);

const looks: Look[] = [
  { index: 0, title: "Weekend uniform", rationale: "Mid-blue denim keeps the tee light.", items: [denim, sneaker, tote] },
  { index: 1, title: "Harmattan layers", rationale: "Dusty-season tones over a heavy base.", items: [cap, runner] },
  { index: 2, title: "After dark", rationale: "Tonal and sharp.", items: [denim, runner, tote, cap] },
];

const noop = () => {};

describe("LookBoard", () => {
  it("renders the AI label, tooltip, centre tile, items and prices", () => {
    mockMatchMedia();
    render(<LookBoard current={current} looks={looks} onQuickAdd={noop} onAddAll={noop} />);
    expect(screen.getByRole("heading", { name: "Complete the look" })).toBeInTheDocument();
    expect(screen.getByText("Suggested by AI")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "About AI suggestions" })).toHaveAccessibleDescription(AI_TOOLTIP);
    expect(screen.getByText("This piece")).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Pieces in Weekend uniform" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(within(list).getByText("$72.00")).toBeInTheDocument();
    // next/link drops the trailing slash under Vitest (trailingSlash is a build-time flag).
    expect(within(list).getByRole("link", { name: denim.name }).getAttribute("href")).toMatch(
      /^\/product\/?\?slug=straight-denim$/,
    );
    expect(screen.getByText("Mid-blue denim keeps the tee light.")).toBeInTheDocument();
  });

  it("switches looks with arrow keys, Home and End (roving tabindex)", async () => {
    mockMatchMedia();
    const user = userEvent.setup();
    render(<LookBoard current={current} looks={looks} onQuickAdd={noop} onAddAll={noop} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");

    await user.tab(); // AI info button
    await user.tab(); // selected tab
    expect(tabs[0]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Dusty-season tones over a heavy base.")).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tabs[1]?.id);

    await user.keyboard("{End}");
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Tonal and sharp.")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}"); // wraps
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowLeft}"); // wraps back
    expect(tabs[2]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("marks sold-out items, disables their quick add and skips them in add-all", async () => {
    mockMatchMedia();
    const user = userEvent.setup();
    const onAddAll = vi.fn();
    const onQuickAdd = vi.fn();
    render(<LookBoard current={current} looks={looks} onQuickAdd={onQuickAdd} onAddAll={onAddAll} />);

    expect(screen.getByText("Sold out")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Quick add ${sneaker.name}` })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: `Quick add ${denim.name}` }));
    expect(onQuickAdd).toHaveBeenCalledWith(denim);

    await user.click(screen.getByRole("button", { name: "Add the full look" }));
    expect(onAddAll).toHaveBeenCalledTimes(1);
    const sent = onAddAll.mock.calls[0]?.[0] as ProductSummary[];
    expect(sent.map((p) => p.id)).toEqual([current.id, denim.id, tote.id]);
    expect(sent.some((p) => p.totalStock === 0)).toBe(false);
  });

  it("shows the error state with a working Retry", async () => {
    mockMatchMedia();
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <LookBoard current={current} looks={[]} onQuickAdd={noop} onAddAll={noop} error="timeout" onRetry={onRetry} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(STYLIST_ERROR);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows the loading state", () => {
    mockMatchMedia();
    render(<LookBoard current={current} looks={looks} onQuickAdd={noop} onAddAll={noop} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Styling…");
    expect(screen.queryByRole("button", { name: "Add the full look" })).not.toBeInTheDocument();
  });

  it("renders the footer slot and nothing at all when there are no looks", () => {
    mockMatchMedia();
    const { rerender, container } = render(
      <LookBoard
        current={current}
        looks={looks}
        onQuickAdd={noop}
        onAddAll={noop}
        footerSlot={<button type="button">Regenerate (local AI)</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Regenerate (local AI)" })).toBeInTheDocument();
    rerender(<LookBoard current={current} looks={[]} onQuickAdd={noop} onAddAll={noop} />);
    expect(container).toBeEmptyDOMElement();
  });
});
