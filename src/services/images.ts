import { supabase } from "@/integrations/supabase/client";

export const PROPERTY_BUCKET = "property-images";
export const AVATAR_BUCKET = "avatars";
const SIGNED_TTL = 60 * 60 * 6;

export function isRemoteUrl(value?: string | null) {
  return !!value && /^https?:\/\//i.test(value);
}

/** Private buckets need signed URLs; remote URLs are passed straight through. */
export async function resolveImageUrl(
  bucket: string,
  storagePath?: string | null,
  fallbackUrl?: string | null,
): Promise<string | null> {
  if (isRemoteUrl(fallbackUrl)) return fallbackUrl ?? null;
  const path = storagePath ?? fallbackUrl;
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_TTL);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function uploadPropertyImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `properties/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PROPERTY_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    ...(file.type ? { contentType: file.type } : {}),
  });
  if (error) throw error;
  return path;
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

export async function deleteStorageObject(bucket: string, path?: string | null) {
  if (!path || isRemoteUrl(path)) return;
  await supabase.storage.from(bucket).remove([path]);
}
