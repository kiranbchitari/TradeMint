"use client";

import { useState, useTransition } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { registerAction } from "../actions";
import { registerSchema, type RegisterInput } from "../schemas";
import { AuthMessage } from "./auth-message";
import { GoogleAuthButton } from "./google-auth-button";
import { PasswordInput } from "./password-input";

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  function onSubmit(values: RegisterInput) {
    setServerError(null);
    setSuccess(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("fullName", values.fullName);
      fd.set("email", values.email);
      fd.set("password", values.password);
      const res = await registerAction(fd);
      if (res?.error) setServerError(res.error);
      if (res?.success) {
        setSuccess(res.success);
        form.reset();
      }
    });
  }

  if (success) {
    return <AuthMessage type="success">{success}</AuthMessage>;
  }

  return (
    <div className="space-y-5">
      <GoogleAuthButton />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR SIGN UP WITH EMAIL
        <span className="h-px flex-1 bg-border" />
      </div>

      {serverError && <AuthMessage type="error">{serverError}</AuthMessage>}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="name"
                    placeholder="Jane Trader"
                    className="h-9"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    className="h-9"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Use 8 or more characters.
                </FormDescription>
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
            Create account
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
