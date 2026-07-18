"use client";

import { STORAGE_BUCKETS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

/** Upload files to the private trade-images bucket under {uid}/{tradeId}/. */
export async function uploadTradeImages(
  tradeId: string,
  files: File[],
): Promise<{ path: string }[]> {
  if (files.length === 0) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const results: { path: string }[] = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${tradeId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.tradeImages)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (!error) results.push({ path });
  }
  return results;
}

/** Create short-lived signed URLs for private trade images. */
export async function getSignedUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = createClient();
  const { data } = await supabase.storage
    .from(STORAGE_BUCKETS.tradeImages)
    .createSignedUrls(paths, expiresIn);
  const map: Record<string, string> = {};
  (data ?? []).forEach((item) => {
    if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  });
  return map;
}
