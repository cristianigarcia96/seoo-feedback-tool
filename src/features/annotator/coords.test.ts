import { describe, it, expect } from "vitest";
import { originalToRenderedY, renderedToOriginalY, sliceBands } from "./coords";

// blockHeight for an open wf === its height; collapsed === COLLAPSED_STRIP_H (68).
const wf = (insertY: number, height: number, open = true) => ({ insertY, height, open });

describe("originalToRenderedY", () => {
  it("is identity with no wireframes", () => {
    expect(originalToRenderedY(150, [])).toBe(150);
  });

  it("shifts points below an inserted wireframe down by its height", () => {
    const wfs = [wf(100, 200)];
    expect(originalToRenderedY(50, wfs)).toBe(50); // above the insert point
    expect(originalToRenderedY(150, wfs)).toBe(350); // below: +200
  });

  it("composes multiple stacked wireframes", () => {
    const wfs = [wf(100, 200), wf(300, 100)];
    expect(originalToRenderedY(310, wfs)).toBe(610); // +200 +100
  });

  it("uses collapsed strip height for collapsed wireframes", () => {
    const wfs = [wf(100, 200, false)];
    expect(originalToRenderedY(150, wfs)).toBe(150 + 68);
  });
});

describe("renderedToOriginalY (round-trips the forward map)", () => {
  const cases: Array<[number, ReturnType<typeof wf>[]]> = [
    [50, [wf(100, 200)]],
    [150, [wf(100, 200)]],
    [310, [wf(100, 200), wf(300, 100)]],
    [250, [wf(100, 200), wf(300, 100)]],
    [500, [wf(100, 200, false), wf(300, 100)]],
  ];
  it.each(cases)("original %i survives original→rendered→original", (originalY, wfs) => {
    const rendered = originalToRenderedY(originalY, wfs);
    expect(renderedToOriginalY(rendered, wfs)).toBe(originalY);
  });

  it("clamps negative results to 0", () => {
    expect(renderedToOriginalY(-40, [])).toBe(0);
  });
});

describe("sliceBands", () => {
  it("returns a single full-height band with no wireframes", () => {
    expect(sliceBands([], 1000)).toEqual([{ startY: 0, endY: null }]);
  });

  it("splits the screenshot at each insert point in order", () => {
    expect(sliceBands([wf(300, 1), wf(100, 1)], 1000)).toEqual([
      { startY: 0, endY: 100 },
      { startY: 100, endY: 300 },
      { startY: 300, endY: null },
    ]);
  });

  it("clamps insert points to the screenshot height", () => {
    expect(sliceBands([wf(5000, 1)], 1000)).toEqual([
      { startY: 0, endY: 1000 },
      { startY: 1000, endY: null },
    ]);
  });
});
