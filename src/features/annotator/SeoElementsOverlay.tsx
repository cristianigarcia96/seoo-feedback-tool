import { useState } from "react";
import type { SeoElement, Wireframe } from "@/lib/types";
import { originalToRenderedY } from "./coords";
import { EMERALD } from "./theme";

interface Props {
  elements: SeoElement[];
  /** Wireframes currently inserted (edited view) so badges track shifted content. */
  wireframes: Wireframe[];
}

/** Always-on hover badges naming tagged elements (H1, IMG + alt, CTA…). Purely
 *  informational; no click/edit behavior, no mode. Anchored in original space,
 *  shifted to rendered space so they stay attached when wireframes push content. */
export function SeoElementsOverlay({ elements, wireframes }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {elements.map((el) => (
        <SeoBox key={el.id} el={el} top={originalToRenderedY(el.y, wireframes)} />
      ))}
    </div>
  );
}

function SeoBox({ el, top }: { el: SeoElement; top: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="absolute"
      style={{
        left: el.x,
        top,
        width: el.width,
        height: el.height,
        pointerEvents: "auto",
        outline: hovered ? `2px solid ${EMERALD}` : "2px solid transparent",
        outlineOffset: 2,
        transition: "outline-color 120ms",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div
          className="absolute -top-7 left-0 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap"
          style={{ backgroundColor: EMERALD, zIndex: 40, fontFamily: "monospace" }}
        >
          {el.type}
          {el.detail ? ` — ${el.detail}` : ""}
        </div>
      )}
    </div>
  );
}
