// Loads a PageBundle and exposes optimistic mutators. Local state is the render
// source of truth; repository calls persist in the background. Keeps the
// Annotator component focused on interaction, not data plumbing.

import { useCallback, useEffect, useState } from "react";
import type {
  Comment,
  PageBundle,
  TextPreset,
  Wireframe,
  WireframeElement,
  WireframeElementType,
} from "@/lib/types";
import { repository } from "@/data";
import type { NewComment, NewWireframe } from "@/data/repository";

let localSeq = 1;
const localId = (p: string) => `local-${p}-${localSeq++}`;

const DEFAULT_ELEMENTS = (): Array<Omit<WireframeElement, "id" | "wireframeId">> => [
  { type: "text", preset: "heading", content: "New heading", x: 30, y: 24, width: 300, height: 0, label: "", z: 0 },
  { type: "text", preset: "body", content: "Supporting copy goes here.", x: 30, y: 58, width: 280, height: 0, label: "", z: 1 },
  { type: "rect", preset: "body", content: "", x: 30, y: 100, width: 140, height: 36, label: "CTA button", z: 2 },
];

function newElement(type: WireframeElementType, wireframeId: string, z: number): WireframeElement {
  const base = { id: localId("wfe"), wireframeId, x: 30, y: 30, z, preset: "body" as TextPreset, content: "", label: "", height: 0 };
  if (type === "text") return { ...base, type, content: "New text", width: 200 };
  if (type === "rect") return { ...base, type, label: "Box", width: 160, height: 80 };
  return { ...base, type, width: 160 };
}

export interface AnnotatorState {
  loading: boolean;
  error: string | null;
  bundle: PageBundle | null;
  addComment: (input: Omit<NewComment, "pageId">) => Comment | null;
  updateComment: (id: string, patch: Partial<Comment>) => void;
  deleteComment: (id: string) => void;
  addWireframe: (insertY: number) => Wireframe | null;
  updateWireframe: (id: string, patch: Partial<Wireframe>) => void;
  deleteWireframe: (id: string) => void;
  saveElements: (wireframeId: string, elements: WireframeElement[]) => void;
  addElement: (wireframeId: string, type: WireframeElementType) => void;
}

type Source = { pageId: string } | { shareToken: string };

export function useAnnotatorState(source: Source): AnnotatorState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<PageBundle | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load =
      "pageId" in source
        ? repository.getPageBundle(source.pageId)
        : repository.getSharedBundle(source.shareToken);
    load
      .then((b) => {
        if (cancelled) return;
        setBundle(b);
        setError(b ? null : "Page not found");
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, ["pageId" in source ? source.pageId : source.shareToken]);

  const patchBundle = useCallback((fn: (b: PageBundle) => PageBundle) => {
    setBundle((prev) => (prev ? fn(prev) : prev));
  }, []);

  const addComment = useCallback<AnnotatorState["addComment"]>(
    (input) => {
      if (!bundle) return null;
      const optimistic: Comment = {
        ...input,
        id: localId("comment"),
        pageId: bundle.page.id,
        createdAt: new Date().toISOString(),
      };
      patchBundle((b) => ({ ...b, comments: [...b.comments, optimistic] }));
      repository
        .createComment({ ...input, pageId: bundle.page.id })
        .then((saved) =>
          patchBundle((b) => ({
            ...b,
            comments: b.comments.map((c) => (c.id === optimistic.id ? saved : c)),
          })),
        )
        .catch((e) => console.error("createComment failed", e));
      return optimistic;
    },
    [bundle, patchBundle],
  );

  const updateComment = useCallback<AnnotatorState["updateComment"]>(
    (id, patch) => {
      patchBundle((b) => ({ ...b, comments: b.comments.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      repository.updateComment(id, patch).catch((e) => console.error("updateComment failed", e));
    },
    [patchBundle],
  );

  const deleteComment = useCallback<AnnotatorState["deleteComment"]>(
    (id) => {
      patchBundle((b) => ({ ...b, comments: b.comments.filter((c) => c.id !== id) }));
      repository.deleteComment(id).catch((e) => console.error("deleteComment failed", e));
    },
    [patchBundle],
  );

  const addWireframe = useCallback<AnnotatorState["addWireframe"]>(
    (insertY) => {
      if (!bundle) return null;
      const id = localId("wireframe");
      const elements: WireframeElement[] = DEFAULT_ELEMENTS().map((el) => ({
        ...el,
        id: localId("wfe"),
        wireframeId: id,
      }));
      const optimistic: Wireframe = {
        id,
        pageId: bundle.page.id,
        insertY,
        title: "New section",
        height: 220,
        open: true,
        elements,
        createdAt: new Date().toISOString(),
      };
      patchBundle((b) => ({ ...b, wireframes: [...b.wireframes, optimistic] }));
      const payload: NewWireframe = {
        pageId: bundle.page.id,
        insertY,
        title: optimistic.title,
        height: optimistic.height,
        open: optimistic.open,
        elements: DEFAULT_ELEMENTS(),
      };
      repository
        .createWireframe(payload)
        .then((saved) =>
          patchBundle((b) => ({ ...b, wireframes: b.wireframes.map((w) => (w.id === id ? saved : w)) })),
        )
        .catch((e) => console.error("createWireframe failed", e));
      return optimistic;
    },
    [bundle, patchBundle],
  );

  const updateWireframe = useCallback<AnnotatorState["updateWireframe"]>(
    (id, patch) => {
      patchBundle((b) => ({ ...b, wireframes: b.wireframes.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
      const { elements, ...persistable } = patch;
      void elements;
      repository.updateWireframe(id, persistable).catch((e) => console.error("updateWireframe failed", e));
    },
    [patchBundle],
  );

  const deleteWireframe = useCallback<AnnotatorState["deleteWireframe"]>(
    (id) => {
      patchBundle((b) => ({ ...b, wireframes: b.wireframes.filter((w) => w.id !== id) }));
      repository.deleteWireframe(id).catch((e) => console.error("deleteWireframe failed", e));
    },
    [patchBundle],
  );

  const saveElements = useCallback<AnnotatorState["saveElements"]>(
    (wireframeId, elements) => {
      patchBundle((b) => ({
        ...b,
        wireframes: b.wireframes.map((w) => (w.id === wireframeId ? { ...w, elements } : w)),
      }));
      repository.saveWireframeElements(wireframeId, elements).catch((e) => console.error("saveElements failed", e));
    },
    [patchBundle],
  );

  const addElement = useCallback<AnnotatorState["addElement"]>(
    (wireframeId, type) => {
      let next: WireframeElement[] = [];
      patchBundle((b) => ({
        ...b,
        wireframes: b.wireframes.map((w) => {
          if (w.id !== wireframeId) return w;
          next = [...w.elements, newElement(type, wireframeId, w.elements.length)];
          return { ...w, elements: next };
        }),
      }));
      repository.saveWireframeElements(wireframeId, next).catch((e) => console.error("addElement failed", e));
    },
    [patchBundle],
  );

  return {
    loading,
    error,
    bundle,
    addComment,
    updateComment,
    deleteComment,
    addWireframe,
    updateWireframe,
    deleteWireframe,
    saveElements,
    addElement,
  };
}
