import { useCallback } from "react";
import type { WireframeElement } from "@/lib/types";
import { TEXT_PRESETS, VIOLET } from "./theme";

interface Props {
  el: WireframeElement;
  editable: boolean;
  isSelected: boolean;
  onSelect: () => void;
  /** Commit a moved/resized element (drag end or during drag). */
  onChange: (patch: Partial<WireframeElement>) => void;
}

type DragMode = "drag" | "resize";

/** Renders one wireframe primitive and wires pointer drag/resize when editable. */
export function WireframeElementView({ el, editable, isSelected, onSelect, onChange }: Props) {
  const startDrag = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const orig = { x: el.x, y: el.y, width: el.width, height: el.height };
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (mode === "drag") {
          onChange({ x: Math.max(0, orig.x + dx), y: Math.max(0, orig.y + dy) });
        } else {
          onChange({
            width: Math.max(30, orig.width + dx),
            height: el.type === "rect" ? Math.max(20, orig.height + dy) : orig.height,
          });
        }
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [el, onChange],
  );

  const ring = isSelected ? { boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${VIOLET}` } : undefined;
  const commonHandlers = editable
    ? {
        onMouseDown: (e: React.MouseEvent) => startDrag(e, "drag"),
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
          onSelect();
        },
      }
    : {};

  const resizeHandle = editable && el.type !== "line" && (
    <div
      onMouseDown={(e) => startDrag(e, "resize")}
      className="absolute -right-1.5 -bottom-1.5 w-3 h-3 rounded-full cursor-nwse-resize"
      style={{ opacity: isSelected ? 1 : 0, backgroundColor: VIOLET }}
    />
  );

  if (el.type === "text") {
    const preset = TEXT_PRESETS[el.preset];
    return (
      <div
        {...commonHandlers}
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width,
          fontSize: preset.fontSize,
          fontWeight: preset.fontWeight,
          cursor: editable ? "move" : "default",
          userSelect: "none",
          color: "#2e1065",
          ...ring,
        }}
        className="font-sans leading-snug px-1.5 py-0.5 -mx-1.5 -my-0.5 rounded bg-white/80 inline-block"
      >
        {el.content}
        {resizeHandle}
      </div>
    );
  }

  if (el.type === "rect") {
    return (
      <div
        {...commonHandlers}
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          cursor: editable ? "move" : "default",
          borderColor: VIOLET,
          color: VIOLET,
          ...ring,
        }}
        className="border-2 border-solid bg-white flex items-center justify-center text-[10px] font-semibold uppercase tracking-wide select-none shadow-sm"
      >
        {el.label}
        {resizeHandle}
      </div>
    );
  }

  // line
  return (
    <div
      {...commonHandlers}
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: 2,
        cursor: editable ? "move" : "default",
        backgroundColor: VIOLET,
        ...ring,
      }}
    />
  );
}
