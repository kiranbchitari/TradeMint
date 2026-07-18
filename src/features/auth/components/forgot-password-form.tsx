"use client";

import { useState, useTransition } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { requestPasswordResetAction } from "../actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "../schemas";
import { AuthMessage } from "./auth-message";

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    setSuccess(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("email", values.email);
      const res = await requestPasswordResetAction(fd);
      if (res?.error) setServerError(res.error);
      if (res?.success) setSuccess(res.success);
    });
  }

  return (
    <div className="space-y-5">
      {success ? (
        <AuthMessage type="success">{success}</AuthMessage>
      ) : (
        <>
          {serverError && <AuthMessage type="error">{serverError}</AuthMessage>}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isPending}
              >
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
          </Form>
        </>
      )}

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </div>
  );
}
