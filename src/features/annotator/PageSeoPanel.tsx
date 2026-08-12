import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PageSeoMeta } from "@/lib/types";

/** Page-level SEO metadata (title tag, meta description, canonical…) that isn't
 *  tied to a single visible element, so it's shown here rather than as a hover
 *  badge (per the brief's open question on SEO coverage). */
export function PageSeoPanel({ meta }: { meta: PageSeoMeta }) {
  const [open, setOpen] = useState(false);
  const rows: Array<[string, string | number | null]> = [
    ["Title tag", meta.titleTag],
    ["Meta description", meta.metaDescription],
    ["Canonical", meta.canonical],
    ["Robots", meta.robots],
    ["H1 count", meta.h1Count],
  ];

  return (
    <div className="w-full mx-auto mt-4 bg-white border border-stone-200 rounded-lg overflow-hidden" style={{ maxWidth: "var(--frame-w)" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-stone-700 hover:bg-stone-50"
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Page SEO
      </button>
      {open && (
        <dl className="px-4 pb-3 grid grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 text-[12px]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-stone-400 py-1">{label}</dt>
              <dd className="text-stone-700 py-1 break-words">
                {value === null || value === "" ? (
                  <span className="text-stone-300">—</span>
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
