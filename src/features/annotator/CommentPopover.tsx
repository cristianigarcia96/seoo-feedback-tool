import { useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import type { Comment } from "@/lib/types";

interface Props {
  comment: Comment;
  /** Rendered-space Y for positioning (converted by the parent). */
  top: number;
  editMode: boolean;
  onClose: () => void;
  onChange: (patch: Partial<Comment>) => void;
  onDelete: () => void;
}

/** Read view for clients; edit form for the SEO. Suggested copy is visually
 *  distinct (green) since it's actionable replacement text, not commentary. */
export function CommentPopover({ comment, top, editMode, onClose, onChange, onDelete }: Props) {
  const [draft, setDraft] = useState(comment);
  const isNew = comment.title === "" && comment.note === "";
  const save = () => {
    onChange({
      title: draft.title,
      note: draft.note,
      suggestedCopy: draft.suggestedCopy,
    });
    onClose();
  };

  return (
    <div
      style={{ position: "absolute", top: top + 16, left: Math.min(comment.x, 620), zIndex: 40 }}
      className="w-72 bg-white rounded-md shadow-xl border border-stone-200 p-3"
      onClick={(e) => e.stopPropagation()}
    >
      {editMode ? (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">
              {isNew ? "New comment" : "Edit comment"}
            </span>
            <button onClick={onClose} className="text-stone-300 hover:text-stone-500">
              <X size={13} />
            </button>
          </div>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Short title (e.g. Meta title too generic)"
            className="w-full text-[12px] font-semibold border border-stone-200 rounded px-2 py-1.5 mb-2"
          />
          <textarea
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            placeholder="Comment / issue notes..."
            rows={3}
            className="w-full text-[12px] text-stone-600 border border-stone-200 rounded px-2 py-1.5 mb-2 resize-none"
          />
          <label className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium mb-1.5">
            <input
              type="checkbox"
              checked={draft.suggestedCopy !== null}
              onChange={(e) => setDraft({ ...draft, suggestedCopy: e.target.checked ? "" : null })}
            />
            Include suggested copy
          </label>
          {draft.suggestedCopy !== null && (
            <textarea
              value={draft.suggestedCopy}
              onChange={(e) => setDraft({ ...draft, suggestedCopy: e.target.value })}
              placeholder="Suggested replacement copy..."
              rows={2}
              className="w-full text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 mb-2 resize-none"
            />
          )}
          <div className="flex justify-between items-center mt-2">
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600"
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1 text-[11px] font-semibold bg-stone-800 text-white px-3 py-1.5 rounded-md hover:bg-stone-900"
            >
              <Check size={12} /> Save
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between mb-1">
            <div className="text-[12px] font-semibold text-stone-800">
              {comment.title || "Untitled comment"}
            </div>
            <button onClick={onClose} className="text-stone-300 hover:text-stone-500">
              <X size={13} />
            </button>
          </div>
          <div className="text-[12px] text-stone-500 leading-relaxed mb-2">{comment.note}</div>
          {comment.suggestedCopy && (
            <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1.5 leading-relaxed">
              <span className="font-semibold uppercase tracking-wide text-[9px] block mb-1">
                Suggested copy
              </span>
              {comment.suggestedCopy}
            </div>
          )}
        </>
      )}
    </div>
  );
}
