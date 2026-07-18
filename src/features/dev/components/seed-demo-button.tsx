"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { seedDemoDataAction } from "../actions";

export function SeedDemoButton({
  variant = "default",
}: {
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function seed() {
    startTransition(async () => {
      const res = await seedDemoDataAction();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Added ${res.data?.count ?? 0} demo trades`);
      router.refresh();
    });
  }

  return (
    <Button variant={variant} onClick={seed} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      Load demo data
    </Button>
  );
}
