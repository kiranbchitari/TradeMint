"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EMOTION_LABELS, EMOTIONS, type Emotion } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { TradeComment } from "@/types/models";

import { addTradeCommentAction, deleteTradeCommentAction } from "../actions";

const NO_FEELING = "none";

/**
 * A journal-style commentary feed for a trade — timestamped notes capturing
 * how the trader feels as it progresses. Newest notes append to the bottom so
 * it reads as a timeline.
 */
export function TradeComments({
  tradeId,
  comments,
  canComment,
  isOwner,
  currentUserId,
}: {
  tradeId: string;
  comments: TradeComment[];
  /** Owner, commenter and editor can post; viewers cannot. */
  canComment: boolean;
  /** The trade owner may delete anyone's note; others only their own. */
  isOwner: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [emotion, setEmotion] = React.useState<string>(NO_FEELING);
  const [pending, startTransition] = React.useTransition();

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const res = await addTradeCommentAction(tradeId, {
        body: trimmed,
        emotion: emotion === NO_FEELING ? null : emotion,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setBody("");
      setEmotion(NO_FEELING);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteTradeCommentAction(id, tradeId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {/* Composer */}
      {canComment ? (
      <div className="space-y-2.5">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="How are you feeling about this trade right now?"
          rows={3}
          className="resize-none"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Select value={emotion} onValueChange={setEmotion}>
            <SelectTrigger className="h-9 w-[150px]">
              <SelectValue placeholder="Feeling" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_FEELING}>No feeling</SelectItem>
              {EMOTIONS.map((em) => (
                <SelectItem key={em} value={em}>
                  {EMOTION_LABELS[em]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="ml-auto"
            size="sm"
            disabled={pending || !body.trim()}
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Add note
          </Button>
        </div>
      </div>
      ) : (
        <p className="rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
          You have view-only access to this trade.
        </p>
      )}

      {/* Feed */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notes yet. Capture how you feel as the trade plays out — entry
          nerves, mid-trade doubts, the exit.
        </p>
      ) : (
        <ol className="relative space-y-4 border-l pl-4">
          {comments.map((c) => {
            const mine = currentUserId != null && c.user_id === currentUserId;
            const author = mine
              ? "You"
              : c.author_name ?? c.author_email ?? "Unknown";
            const canDelete = mine || isOwner;
            return (
              <li key={c.id} className="group relative">
                <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary/70 ring-4 ring-background" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{author}</span>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={c.created_at}
                    title={formatDateTime(c.created_at)}
                  >
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                    })}
                  </time>
                  {c.emotion && (
                    <Badge
                      variant="secondary"
                      className="h-5 px-1.5 text-[11px]"
                    >
                      {EMOTION_LABELS[c.emotion as Emotion] ?? c.emotion}
                    </Badge>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      // Always tappable on touch; hover-reveal on desktop.
                      className="ml-auto opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                      disabled={pending}
                      onClick={() => remove(c.id)}
                      aria-label="Delete note"
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <p className="mt-0.5 text-sm whitespace-pre-wrap">{c.body}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
