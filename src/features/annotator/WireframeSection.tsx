import { useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  LayoutTemplate,
  Minus,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import type { Wireframe, WireframeElement, WireframeElementType } from "@/lib/types";
import { HEADER_H } from "./coords";
import { VIOLET } from "./theme";
import { WireframeElementView } from "./WireframeElementView";

interface Props {
  wireframe: Wireframe;
  editMode: boolean;
  selectedElementId: string | null;
  onToggleOpen: () => void;
  onSelectElement: (elId: string | null) => void;
  onChangeElement: (elId: string, patch: Partial<WireframeElement>) => void;
  onResizeHeight: (height: number) => void;
  onDelete: () => void;
  onAddElement: (type: WireframeElementType) => void;
}

/** One sliced-in wireframe section: collapsible, editable canvas of primitives. */
export function WireframeSection({
  wireframe,
  editMode,
  selectedElementId,
  onToggleOpen,
  onSelectElement,
  onChangeElement,
  onResizeHeight,
  onDelete,
  onAddElement,
}: Props) {
  const { title, height, open, elements } = wireframe;

  const startHeightDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startY = e.clientY;
      const startH = height;
      const onMove = (ev: MouseEvent) => onResizeHeight(Math.max(140, startH + (ev.clientY - startY)));
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [height, onResizeHeight],
  );

  if (!open) {
    return (
      <div className="w-full flex items-center justify-between px-6 py-4 bg-violet-100 border-y-2 border-violet-400 shrink-0">
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          <div
            className="w-9 h-9 rounded-md text-white flex items-center justify-center shrink-0"
            style={{ backgroundColor: VIOLET }}
          >
            <LayoutTemplate size={16} />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-violet-900">{title}</div>
            <div className="text-[11px] text-violet-600">{elements.length} elements · click to open</div>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {editMode && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-600 px-2 py-1.5"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button
            onClick={onToggleOpen}
            className="flex items-center gap-1.5 text-[12px] font-semibold bg-white px-3 py-1.5 rounded-md"
            style={{ color: VIOLET }}
          >
            <ChevronDown size={14} strokeWidth={3} /> Open
          </button>
        </div>
      </div>
    );
  }

  const addBtn = (type: WireframeElementType, icon: React.ReactNode, label: string) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onAddElement(type);
      }}
      className="flex items-center gap-1 text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2 py-1.5 rounded-md"
    >
      {icon} {label}
    </button>
  );

  return (
    <div
      style={{ height }}
      className="w-full relative shrink-0 border-y-2 border-violet-400 bg-violet-50"
      onClick={() => editMode && onSelectElement(null)}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.35,
          backgroundImage:
            "repeating-linear-gradient(135deg, #C4B5FD 0px, #C4B5FD 1px, transparent 1px, transparent 12px)",
        }}
      />

      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 z-20 text-white"
        style={{ height: HEADER_H, backgroundColor: VIOLET }}
      >
        <div className="flex items-center gap-2 text-[13px] font-semibold truncate">
          <LayoutTemplate size={15} className="shrink-0" /> {title}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {editMode && (
            <>
              {addBtn("text", <Type size={12} />, "Text")}
              {addBtn("rect", <Square size={12} />, "Box")}
              {addBtn("line", <Minus size={12} />, "Line")}
              <div className="w-px h-4 bg-white/25 mx-1" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white px-2 py-1.5"
              >
                <Trash2 size={13} /> Delete
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleOpen();
            }}
            className="flex items-center gap-1.5 text-[12px] font-bold bg-white px-3 py-1.5 rounded-md shrink-0"
            style={{ color: VIOLET }}
          >
            <ChevronUp size={14} strokeWidth={3} color={VIOLET} /> Collapse
          </button>
        </div>
      </div>

      <div className="absolute left-0 right-0" style={{ top: HEADER_H, bottom: 0 }}>
        {elements.map((el) => (
          <WireframeElementView
            key={el.id}
            el={el}
            editable={editMode}
            isSelected={selectedElementId === el.id}
            onSelect={() => onSelectElement(el.id)}
            onChange={(patch) => onChangeElement(el.id, patch)}
          />
        ))}
      </div>

      {editMode && (
        <div
          onMouseDown={startHeightDrag}
          className="absolute left-0 right-0 bottom-0 h-4 flex items-center justify-center cursor-ns-resize z-10"
        >
          <div
            className="w-16 h-2 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: "rgba(124,58,237,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(124,58,237,0.5)")}
          >
            <GripHorizontal size={11} className="text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
