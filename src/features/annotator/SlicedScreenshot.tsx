import React from "react";
import type { Wireframe, WireframeElement, WireframeElementType } from "@/lib/types";
import { sliceBands } from "./coords";
import { WireframeSection } from "./WireframeSection";

interface Props {
  screenshotUrl: string;
  screenshotHeight: number;
  /** Wireframes to slice in. Pass [] to render the untouched original. */
  wireframes: Wireframe[];
  editMode: boolean;
  selectedElement: { wireframeId: string; elId: string } | null;
  onToggleOpen: (id: string) => void;
  onSelectElement: (wireframeId: string, elId: string | null) => void;
  onChangeElement: (wireframeId: string, elId: string, patch: Partial<WireframeElement>) => void;
  onResizeHeight: (id: string, height: number) => void;
  onDeleteWireframe: (id: string) => void;
  onAddElement: (id: string, type: WireframeElementType) => void;
}

/**
 * Renders the captured screenshot as horizontal bands with wireframe sections
 * spliced between them (Gotcha #2). Unlike the prototype's re-render-the-DOM
 * hack, this clips a single raster at each insert offset — the production-correct
 * way to slice a screenshot at an arbitrary pixel: each band shows the same
 * image shifted up by the band's start offset, inside an overflow-hidden window.
 *
 * Assumes the screenshot is displayed 1:1 with its capture width (CAPTURE_WIDTH).
 * If the container is narrower, wrap in a width-scaling parent so original-space
 * offsets stay valid.
 */
export function SlicedScreenshot({
  screenshotUrl,
  screenshotHeight,
  wireframes,
  editMode,
  selectedElement,
  onToggleOpen,
  onSelectElement,
  onChangeElement,
  onResizeHeight,
  onDeleteWireframe,
  onAddElement,
}: Props) {
  const sorted = [...wireframes].sort((a, b) => a.insertY - b.insertY);
  const bands = sliceBands(sorted, screenshotHeight);

  return (
    <>
      {bands.map((band, i) => {
        const bandHeight = (band.endY ?? screenshotHeight) - band.startY;
        const wf = sorted[i];
        return (
          <React.Fragment key={`band-${i}`}>
            <div
              className="w-full relative shrink-0 overflow-hidden"
              style={{ height: Math.max(0, bandHeight) }}
            >
              <img
                src={screenshotUrl}
                alt=""
                draggable={false}
                className="block w-full select-none"
                style={{ transform: `translateY(-${band.startY}px)` }}
              />
            </div>
            {wf && (
              <WireframeSection
                wireframe={wf}
                editMode={editMode}
                selectedElementId={selectedElement?.wireframeId === wf.id ? selectedElement.elId : null}
                onToggleOpen={() => onToggleOpen(wf.id)}
                onSelectElement={(elId) => onSelectElement(wf.id, elId)}
                onChangeElement={(elId, patch) => onChangeElement(wf.id, elId, patch)}
                onResizeHeight={(h) => onResizeHeight(wf.id, h)}
                onDelete={() => onDeleteWireframe(wf.id)}
                onAddElement={(type) => onAddElement(wf.id, type)}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
