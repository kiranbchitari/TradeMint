"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TradeShare } from "@/types/models";

import {
  removeShareAction,
  shareTradeAction,
  updateShareRoleAction,
} from "../actions";
import { SHARE_ROLES } from "../schemas";

const ROLE_LABELS: Record<string, string> = {
  viewer: "Can view",
  commenter: "Can comment",
  editor: "Can edit",
};

export function ShareTradeDialog({
  tradeId,
  symbol,
  shares,
}: {
  tradeId: string;
  symbol: string;
  shares: TradeShare[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<string>("commenter");
  const [pending, startTransition] = React.useTransition();

  function invite() {
    startTransition(async () => {
      const res = await shareTradeAction(tradeId, { email: email.trim(), role });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Invitation sent");
      setEmail("");
      router.refresh();
    });
  }

  function changeRole(shareId: string, nextRole: string) {
    startTransition(async () => {
      const res = await updateShareRoleAction(shareId, tradeId, nextRole);
      if (res.error) toast.error(res.error);
      else router.refresh();
    });
  }

  function revoke(shareId: string) {
    startTransition(async () => {
      const res = await removeShareAction(shareId, tradeId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Access removed");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-4" />
          Share
          {shares.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs text-primary">
              {shares.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share “{symbol}”</DialogTitle>
          <DialogDescription>
            Invite another TradeMint user by email to collaborate on this trade.
          </DialogDescription>
        </DialogHeader>

        {/* Invite */}
        <div className="space-y-2">
          <Label>Invite by email</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@email.com"
              className="h-9"
              onKeyDown={(e) => {
                if (e.key === "Enter" && email.trim()) {
                  e.preventDefault();
                  invite();
                }
              }}
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-9 w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHARE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={pending || !email.trim()} onClick={invite}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Invite"}
            </Button>
          </div>
        </div>

        {/* Current collaborators */}
        <div className="space-y-2">
          <Label>People with access</Label>
          {shares.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No collaborators yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.collaborator_name ?? s.collaborator_email ?? "User"}
                    </p>
                    {s.collaborator_name && s.collaborator_email && (
                      <p className="truncate text-xs text-muted-foreground">
                        {s.collaborator_email}
                      </p>
                    )}
                  </div>
                  <Select
                    value={s.role}
                    onValueChange={(v) => changeRole(s.id, v)}
                  >
                    <SelectTrigger className="h-8 w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SHARE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    onClick={() => revoke(s.id)}
                    aria-label="Remove access"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
