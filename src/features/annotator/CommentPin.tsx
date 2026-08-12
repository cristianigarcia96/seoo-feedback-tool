import { MessageSquare } from "lucide-react";
import type { Comment } from "@/lib/types";

interface Props {
  comment: Comment;
  /** Rendered-space Y (already converted from original space by the parent). */
  top: number;
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export function CommentPin({ comment, top, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{ position: "absolute", top, left: comment.x, zIndex: 30 }}
      className={`w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110 bg-stone-700 ${
        active ? "ring-4 ring-stone-400/40" : ""
      } ${comment.resolved ? "opacity-50" : ""}`}
    >
      <MessageSquare size={12} />
    </button>
  );
}
