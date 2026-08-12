import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { CAPTURE_WIDTH, type WireframeElement } from "@/lib/types";
import { BottomBar, type PageMode, type PlaceMode } from "./BottomBar";
import { CommentPin } from "./CommentPin";
import { CommentPopover } from "./CommentPopover";
import { SeoElementsOverlay } from "./SeoElementsOverlay";
import { SlicedScreenshot } from "./SlicedScreenshot";
import { originalToRenderedY, renderedToOriginalY } from "./coords";
import { TEXT_PRESETS, VIOLET } from "./theme";
import type { AnnotatorState } from "./useAnnotatorState";

interface Props {
  state: AnnotatorState;
  /** SEO edit mode vs read-only client view. */
  editMode: boolean;
}

export function Annotator({ state, editMode }: Props) {
  const { bundle } = state;
  const [pageMode, setPageMode] = useState<PageMode>("edited");
  const [placeMode, setPlaceMode] = useState<PlaceMode>(null);
  const [guideY, setGuideY] = useState<number | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<{ wireframeId: string; elId: string } | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const wireframes = bundle?.wireframes ?? [];
  const comments = bundle?.comments ?? [];
  const seoElements = bundle?.seoElements ?? [];
  const showingWireframes = pageMode === "edited";
  const activeWireframes = showingWireframes ? wireframes : [];

  const selectedEl = useMemo<WireframeElement | null>(() => {
    if (!selectedElement) return null;
    const wf = wireframes.find((w) => w.id === selectedElement.wireframeId);
    return wf?.elements.find((e) => e.id === selectedElement.elId) ?? null;
  }, [selectedElement, wireframes]);

  if (!bundle) return null;
  const { page } = bundle;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (placeMode !== "wireframe" || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    setGuideY(e.clientY - rect.top);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!placeMode || !pageRef.current) return;
    const rect = pageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const renderedY = e.clientY - rect.top;
    // Persist in ORIGINAL space regardless of which view we're in.
    const originalY = showingWireframes ? renderedToOriginalY(renderedY, wireframes) : renderedY;

    if (placeMode === "comment") {
      const created = state.addComment({
        x,
        y: originalY,
        author: "SEO",
        title: "",
        note: "",
        suggestedCopy: null,
        resolved: false,
        clientReply: null,
      });
      if (created) setActiveCommentId(created.id);
      setPlaceMode(null);
    } else if (placeMode === "wireframe") {
      state.addWireframe(originalY);
      setPlaceMode(null);
      setGuideY(null);
    }
  };

  const changeElement = (wireframeId: string, elId: string, patch: Partial<WireframeElement>) => {
    const wf = wireframes.find((w) => w.id === wireframeId);
    if (!wf) return;
    state.saveElements(
      wireframeId,
      wf.elements.map((el) => (el.id === elId ? { ...el, ...patch } : el)),
    );
  };

  const removeElement = (wireframeId: string, elId: string) => {
    const wf = wireframes.find((w) => w.id === wireframeId);
    if (!wf) return;
    state.saveElements(wireframeId, wf.elements.filter((el) => el.id !== elId));
    setSelectedElement(null);
  };

  const setPreset = (wireframeId: string, elId: string, preset: WireframeElement["preset"]) =>
    changeElement(wireframeId, elId, { preset });

  return (
    <>
      {/* The frame is fixed at CAPTURE_WIDTH so original-space px map 1:1 to the
          rendered screenshot; on narrower screens it scrolls horizontally rather
          than scaling (which would desync the overlays). */}
      <div className="w-full overflow-x-auto pb-1">
      <div
        className="rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)] bg-white mx-auto"
        style={{ width: CAPTURE_WIDTH }}
      >
        {/* Fake browser chrome */}
        <div className="h-9 bg-stone-100 border-b border-stone-200 flex items-center px-4 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-stone-300" />
          <div className="ml-4 text-[11px] text-stone-400 bg-white rounded px-3 py-1 flex-1 max-w-[300px] truncate">
            {page.sourceUrl}
          </div>
        </div>

        <div
          ref={pageRef}
          className={`relative select-none ${placeMode === "comment" ? "cursor-crosshair" : ""} ${
            placeMode === "wireframe" ? "cursor-pointer" : ""
          }`}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => placeMode === "wireframe" && setGuideY(null)}
          onClick={handleClick}
        >
          {page.screenshotUrl ? (
            <SlicedScreenshot
              screenshotUrl={page.screenshotUrl}
              screenshotHeight={page.screenshotHeight}
              wireframes={activeWireframes}
              editMode={editMode}
              selectedElement={selectedElement}
              onToggleOpen={(id) => {
                const wf = wireframes.find((w) => w.id === id);
                if (wf) state.updateWireframe(id, { open: !wf.open });
              }}
              onSelectElement={(wfId, elId) => setSelectedElement(elId ? { wireframeId: wfId, elId } : null)}
              onChangeElement={changeElement}
              onResizeHeight={(id, h) => state.updateWireframe(id, { height: h })}
              onDeleteWireframe={(id) => state.deleteWireframe(id)}
              onAddElement={(id, type) => state.addElement(id, type)}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-stone-400 text-sm">
              {page.status === "ready" ? "No screenshot" : `Snapshot ${page.status}…`}
            </div>
          )}

          {/* SEO hover badges — always on, anchored to original content. */}
          <SeoElementsOverlay elements={seoElements} wireframes={activeWireframes} />

          {/* Comment pins + popovers */}
          {comments.map((c) => {
            const top = showingWireframes ? originalToRenderedY(c.y, wireframes) : c.y;
            return (
              <CommentPin
                key={c.id}
                comment={c}
                top={top}
                active={activeCommentId === c.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCommentId(activeCommentId === c.id ? null : c.id);
                }}
              />
            );
          })}
          {comments.map((c) => {
            if (activeCommentId !== c.id) return null;
            const top = showingWireframes ? originalToRenderedY(c.y, wireframes) : c.y;
            return (
              <CommentPopover
                key={`${c.id}-pop`}
                comment={c}
                top={top}
                editMode={editMode}
                onClose={() => setActiveCommentId(null)}
                onChange={(patch) => state.updateComment(c.id, patch)}
                onDelete={() => state.deleteComment(c.id)}
              />
            );
          })}

          {/* Live tracking guide line while placing a section */}
          {placeMode === "wireframe" && guideY !== null && (
            <div className="absolute left-0 right-0 pointer-events-none" style={{ top: guideY, zIndex: 45 }}>
              <div style={{ height: 4, width: "100%", backgroundColor: VIOLET }} />
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Selected-element inspector (SEO edit only) */}
      {editMode && selectedEl && selectedElement && (
        <div className="w-full max-w-[900px] mx-auto mt-4 flex items-center justify-between bg-white border border-stone-200 rounded-lg px-4 py-3">
          <span className="text-[11px] text-stone-400 font-medium">Editing selected element</span>
          <div className="flex items-center gap-3">
            {selectedEl.type === "text" && (
              <select
                value={selectedEl.preset}
                onChange={(e) =>
                  setPreset(selectedElement.wireframeId, selectedEl.id, e.target.value as WireframeElement["preset"])
                }
                className="text-[12px] border border-stone-200 rounded px-2 py-1"
              >
                {Object.entries(TEXT_PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => removeElement(selectedElement.wireframeId, selectedEl.id)}
              className="text-[12px] text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <X size={13} /> Remove element
            </button>
          </div>
        </div>
      )}

      <BottomBar
        editMode={editMode}
        placeMode={placeMode}
        pageMode={pageMode}
        wireframeCount={wireframes.length}
        commentCount={comments.length}
        onSetPlaceMode={(m) => {
          setPlaceMode(m);
          if (m !== "wireframe") setGuideY(null);
        }}
        onSetPageMode={setPageMode}
      />
    </>
  );
}
