import { useParams } from "react-router-dom";
import { Annotator } from "@/features/annotator/Annotator";
import { PageSeoPanel } from "@/features/annotator/PageSeoPanel";
import { useAnnotatorState } from "@/features/annotator/useAnnotatorState";
import { CAPTURE_WIDTH } from "@/lib/types";

/** No-login client view. Resolved by share token; always read-only. The bundle
 *  comes through the anon-safe get_shared_page RPC on the Supabase backend. */
export function SharePage() {
  const { token = "" } = useParams();
  const state = useAnnotatorState({ shareToken: token });
  const frameWidth = state.bundle ? state.bundle.page.screenshotWidth : CAPTURE_WIDTH;

  return (
    <div
      className="min-h-screen pb-40 pt-10 px-4"
      style={{ "--frame-w": `${frameWidth}px` } as React.CSSProperties}
    >
      <div className="w-full mx-auto mb-5" style={{ maxWidth: "var(--frame-w)" }}>
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#B45532] font-semibold mb-1">
          SEO Feedback
        </div>
        <h1 className="font-serif text-2xl text-stone-800">
          {state.bundle ? state.bundle.page.sourceUrl : "Loading…"}
        </h1>
        <p className="text-[13px] text-stone-500 mt-1">
          Review the suggested changes below. Toggle between the original screenshot and the edited
          version at the bottom of the page.
        </p>
      </div>

      {state.loading && <Centered>Loading feedback…</Centered>}
      {state.error && <Centered>This feedback link is invalid or has expired.</Centered>}
      {!state.loading && !state.error && state.bundle && (
        <>
          <Annotator state={state} editMode={false} />
          <PageSeoPanel meta={state.bundle.page.seoMeta} />
        </>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full mx-auto bg-white border border-stone-200 rounded-lg py-16 text-center text-stone-400 text-sm" style={{ maxWidth: "var(--frame-w)" }}>
      {children}
    </div>
  );
}
