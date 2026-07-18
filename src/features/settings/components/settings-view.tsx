"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Download, Loader2, Monitor, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { SectionCard } from "@/components/section-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CURRENCIES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Account, Broker, Profile } from "@/types/models";

import {
  createAccountAction,
  createBrokerAction,
  deleteAccountRecordAction,
  deleteAllDataAction,
  deleteBrokerAction,
  updatePreferencesAction,
  updateProfileAction,
  updateRiskSettingsAction,
} from "../actions";

export function SettingsView({
  profile,
  brokers,
  accounts,
}: {
  profile: Profile | null;
  brokers: Broker[];
  accounts: Account[];
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = React.useTransition();

  const [fullName, setFullName] = React.useState(profile?.full_name ?? "");
  const [currency, setCurrency] = React.useState(profile?.currency ?? "USD");
  const [timezone, setTimezone] = React.useState(profile?.timezone ?? "UTC");

  const risk = (profile?.risk_settings ?? {}) as {
    default_risk_amount?: number;
    account_risk_pct?: number;
  };
  const [riskAmount, setRiskAmount] = React.useState(
    risk.default_risk_amount != null ? String(risk.default_risk_amount) : "",
  );
  const [riskPct, setRiskPct] = React.useState(
    risk.account_risk_pct != null ? String(risk.account_risk_pct) : "",
  );

  const prefs = (profile?.preferences ?? {}) as {
    notify_summary?: boolean;
    notify_alerts?: boolean;
  };
  const [notifySummary, setNotifySummary] = React.useState(
    prefs.notify_summary ?? true,
  );
  const [notifyAlerts, setNotifyAlerts] = React.useState(
    prefs.notify_alerts ?? false,
  );

  const [newBroker, setNewBroker] = React.useState("");
  const [acctName, setAcctName] = React.useState("");
  const [acctCurrency, setAcctCurrency] = React.useState("USD");
  const [acctBalance, setAcctBalance] = React.useState("");

  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });

  async function exportData() {
    const supabase = createClient();
    const [trades, strategies, playbooks, notes, tags] = await Promise.all([
      supabase.from("trades").select("*"),
      supabase.from("strategies").select("*"),
      supabase.from("playbooks").select("*"),
      supabase.from("notes").select("*"),
      supabase.from("tags").select("*"),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      trades: trades.data ?? [],
      strategies: strategies.data ?? [],
      playbooks: playbooks.data ?? [],
      notes: notes.data ?? [],
      tags: tags.data ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trademint-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded");
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Profile */}
      <SectionCard title="Profile">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Timezone</Label>
              <Input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC"
                className="h-9"
              />
            </div>
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  updateProfileAction({
                    full_name: fullName,
                    currency,
                    timezone,
                  }),
                "Profile updated",
              )
            }
          >
            Save profile
          </Button>
        </div>
      </SectionCard>

      {/* Appearance */}
      <SectionCard title="Appearance">
        <div className="space-y-3">
          <Label>Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border py-3 text-sm transition-colors",
                    theme === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon className="size-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* Risk */}
      <SectionCard title="Risk management">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Default risk / trade</Label>
              <Input
                type="number"
                value={riskAmount}
                onChange={(e) => setRiskAmount(e.target.value)}
                placeholder="100"
                className="h-9 font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label>Account risk %</Label>
              <Input
                type="number"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                placeholder="1"
                className="h-9 font-mono"
              />
            </div>
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  updateRiskSettingsAction({
                    default_risk_amount: riskAmount ? Number(riskAmount) : null,
                    account_risk_pct: riskPct ? Number(riskPct) : null,
                  }),
                "Risk settings saved",
              )
            }
          >
            Save risk settings
          </Button>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Weekly summary</p>
              <p className="text-xs text-muted-foreground">
                A performance recap every week.
              </p>
            </div>
            <Switch checked={notifySummary} onCheckedChange={setNotifySummary} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Risk alerts</p>
              <p className="text-xs text-muted-foreground">
                Warn me when I exceed my risk limits.
              </p>
            </div>
            <Switch checked={notifyAlerts} onCheckedChange={setNotifyAlerts} />
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  updatePreferencesAction({
                    notify_summary: notifySummary,
                    notify_alerts: notifyAlerts,
                  }),
                "Preferences saved",
              )
            }
          >
            Save preferences
          </Button>
        </div>
      </SectionCard>

      {/* Brokers */}
      <SectionCard title="Brokers">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newBroker}
              onChange={(e) => setNewBroker(e.target.value)}
              placeholder="Add a broker"
              className="h-9"
            />
            <Button
              variant="outline"
              disabled={pending || !newBroker.trim()}
              onClick={() =>
                run(async () => {
                  const r = await createBrokerAction(newBroker);
                  if (!r.error) setNewBroker("");
                  return r;
                }, "Broker added")
              }
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <ul className="space-y-1.5">
            {brokers.length === 0 && (
              <li className="text-sm text-muted-foreground">No brokers yet.</li>
            )}
            {brokers.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                {b.name}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => run(() => deleteBrokerAction(b.id), "Broker removed")}
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>

      {/* Accounts */}
      <SectionCard title="Accounts">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={acctName}
              onChange={(e) => setAcctName(e.target.value)}
              placeholder="Account name"
              className="h-9"
            />
            <div className="flex gap-2">
              <Select value={acctCurrency} onValueChange={setAcctCurrency}>
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={acctBalance}
                onChange={(e) => setAcctBalance(e.target.value)}
                placeholder="Balance"
                className="h-9 font-mono"
              />
            </div>
          </div>
          <Button
            variant="outline"
            disabled={pending || !acctName.trim()}
            onClick={() =>
              run(async () => {
                const r = await createAccountAction({
                  name: acctName,
                  currency: acctCurrency,
                  starting_balance: acctBalance ? Number(acctBalance) : 0,
                });
                if (!r.error) {
                  setAcctName("");
                  setAcctBalance("");
                }
                return r;
              }, "Account added")
            }
          >
            <Plus className="size-4" /> Add account
          </Button>
          <ul className="space-y-1.5">
            {accounts.length === 0 && (
              <li className="text-sm text-muted-foreground">No accounts yet.</li>
            )}
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  {a.name}{" "}
                  <span className="text-muted-foreground">({a.currency})</span>
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    run(() => deleteAccountRecordAction(a.id), "Account removed")
                  }
                >
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </SectionCard>

      {/* Data */}
      <SectionCard title="Data & backup">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download a full JSON backup of your trades and library.
          </p>
          <Button variant="outline" onClick={exportData}>
            <Download className="size-4" /> Export backup
          </Button>
        </div>
      </SectionCard>

      {/* Danger */}
      <SectionCard title="Danger zone" className="border-destructive/30">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete all your trades and library data. Your account
            stays active. This cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" /> Delete all data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every trade, strategy, note, tag and
                  account. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={(e) => {
                    e.preventDefault();
                    run(() => deleteAllDataAction(), "All data deleted");
                  }}
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SectionCard>
    </div>
  );
}
