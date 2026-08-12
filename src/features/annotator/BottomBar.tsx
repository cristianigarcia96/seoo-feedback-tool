import { LayoutTemplate, MessageSquare, MousePointer2, PanelTopOpen } from "lucide-react";
import { VIOLET } from "./theme";

export type PlaceMode = null | "comment" | "wireframe";
export type PageMode = "original" | "edited";

interface Props {
  editMode: boolean;
  placeMode: PlaceMode;
  pageMode: PageMode;
  wireframeCount: number;
  commentCount: number;
  onSetPlaceMode: (m: PlaceMode) => void;
  onSetPageMode: (m: PageMode) => void;
}

/** Persistent bottom bar: page-wide original/edited toggle (always) plus the
 *  add-to-page tools (SEO edit mode only). */
export function BottomBar({
  editMode,
  placeMode,
  pageMode,
  wireframeCount,
  commentCount,
  onSetPlaceMode,
  onSetPageMode,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-stone-700 z-50">
      {editMode && (
        <div className="border-b border-stone-700 px-4 py-2.5 flex items-center justify-center">
          <div className="w-full max-w-[900px] flex items-center gap-2">
            <span className="text-[11px] text-stone-400 font-medium mr-1">Add to page:</span>
            <ModeButton
              active={placeMode === null}
              icon={<MousePointer2 size={13} />}
              label="Select"
              onClick={() => onSetPlaceMode(null)}
            />
            <ModeButton
              active={placeMode === "comment"}
              icon={<MessageSquare size={13} />}
              label="Add comment"
              onClick={() => onSetPlaceMode(placeMode === "comment" ? null : "comment")}
            />
            <ModeButton
              active={placeMode === "wireframe"}
              icon={<LayoutTemplate size={13} />}
              label="Add section"
              onClick={() => onSetPlaceMode(placeMode === "wireframe" ? null : "wireframe")}
            />
            {placeMode === "comment" && (
              <span className="text-[11px] text-violet-300 font-medium ml-2">
                Click anywhere on the page to place a comment
              </span>
            )}
            {placeMode === "wireframe" && (
              <span className="text-[11px] text-violet-300 font-medium ml-2">
                Move the line to where you want to slice in a section, then click
              </span>
            )}
            {!placeMode && (
              <span className="text-[11px] font-medium ml-2" style={{ color: "#34D399" }}>
                Hover headings, images, and CTAs to see their SEO tag
              </span>
            )}
          </div>
        </div>
      )}
      <div className="px-4 py-3 flex items-center justify-center">
        <div className="w-full max-w-[900px] flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-400 text-[12px]">
            <PanelTopOpen size={14} />
            Viewing:
          </div>
          <div className="flex bg-stone-800 rounded-full p-1">
            <ToggleButton active={pageMode === "original"} onClick={() => onSetPageMode("original")}>
              Original screenshot
            </ToggleButton>
            <ToggleButton active={pageMode === "edited"} onClick={() => onSetPageMode("edited")}>
              Edited version
            </ToggleButton>
          </div>
          <div className="text-[11px] text-stone-500 w-[140px] text-right">
            {wireframeCount} wireframe{wireframeCount !== 1 ? "s" : ""} · {commentCount} comment
            {commentCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-[12px] font-medium rounded-md px-2.5 py-1.5 transition-colors ${
        active ? "text-white" : "text-stone-300 border border-stone-700 hover:bg-stone-800"
      }`}
      style={active ? { backgroundColor: VIOLET } : undefined}
    >
      {icon} {label}
    </button>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
        active ? "bg-white text-stone-900" : "text-stone-400 hover:text-stone-200"
      }`}
    >
      {children}
    </button>
  );
}
