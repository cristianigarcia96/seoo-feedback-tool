// "New snapshot" control. Takes a URL, calls repository.createPage (which, on
// the Supabase backend, invokes the capture-page edge function → screenshot +
// SEO extraction), and hands the created page back to the caller.
//
// Capture is synchronous from the client's view and can take several seconds
// with a real provider, so the button shows a working state throughout.

import { useState, type FormEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import type { Page } from "@/lib/types";
import { repository } from "@/data";

/** Add a scheme if the user typed a bare host, and sanity-check it. */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    return u.hostname.includes(".") ? u.toString() : null;
  } catch {
    return null;
  }
}

export function CaptureUrlForm({
  projectId,
  onCaptured,
}: {
  projectId: string;
  onCaptured: (page: Page) => void;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Enter a valid URL, e.g. example.com/pricing");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const page = await repository.createPage({ projectId, sourceUrl: normalized });
      onCaptured(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={url}
          disabled={busy}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Capture a URL…  (e.g. example.com/pricing)"
          className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-[13px] focus:border-stone-500 focus:outline-none disabled:bg-stone-50"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 rounded-md bg-stone-800 text-white text-[13px] font-medium px-3 py-2 hover:bg-stone-900 disabled:opacity-60 transition-colors whitespace-nowrap"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {busy ? "Capturing…" : "Capture"}
        </button>
      </div>
      {error && <p className="mt-1.5 text-red-600 text-[12px]">{error}</p>}
    </form>
  );
}
