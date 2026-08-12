import { useState } from "react";
import { useParams } from "react-router-dom";
import { Eye, Link2, Pencil } from "lucide-react";
import { Annotator } from "@/features/annotator/Annotator";
import { PageSeoPanel } from "@/features/annotator/PageSeoPanel";
import { useAnnotatorState } from "@/features/annotator/useAnnotatorState";
import { dataSource } from "@/data";

/** SEO-facing editor. Full annotation tools; a preview toggle simulates the
 *  read-only client view without leaving the page. */
export function EditorPage() {
  const { pageId = "" } = useParams();
  const state = useAnnotatorState({ pageId });
  const [preview, setPreview] = useState(false); // true = see it as the client will
  const editMode = !preview;
  const [copied, setCopied] = useState(false);

  const copyShareLink = async () => {
    if (!state.bundle) return;
    const url = `${window.location.origin}/share/${state.bundle.page.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Share link:", url);
    }
  };

  return (
    <div className="min-h-screen pb-40 pt-10 px-4">
      <div className="w-full max-w-[900px] mx-auto mb-5 flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-[#B45532] font-semibold mb-1">
            SEO Feedback {dataSource === "demo" ? "· demo data" : ""}
          </div>
          <h1 className="font-serif text-2xl text-stone-800">
            {state.bundle ? state.bundle.page.sourceUrl : "Loading…"}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyShareLink}
            disabled={!state.bundle}
            className="flex items-center gap-2 text-[12px] font-medium bg-white border border-stone-300 rounded-md px-3 py-2 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <Link2 size={14} />
            {copied ? "Copied!" : "Copy share link"}
          </button>
          <button
            onClick={() => setPreview((v) => !v)}
            className="flex items-center gap-2 text-[12px] font-medium bg-white border border-stone-300 rounded-md px-3 py-2 hover:bg-stone-50 transition-colors"
          >
            {preview ? <Eye size={14} /> : <Pencil size={14} />}
            {preview ? "Client preview (read-only)" : "SEO view (editing)"}
          </button>
        </div>
      </div>

      {state.loading && <Centered>Loading page…</Centered>}
      {state.error && <Centered>{state.error}</Centered>}
      {!state.loading && !state.error && state.bundle && (
        <>
          <Annotator state={state} editMode={editMode} />
          <PageSeoPanel meta={state.bundle.page.seoMeta} />
        </>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[900px] mx-auto bg-white border border-stone-200 rounded-lg py-16 text-center text-stone-400 text-sm">
      {children}
    </div>
  );
}
