import { supabase } from "@/integrations/supabase/client";
import { AVATAR_BUCKET, uploadAvatar } from "@/services/images";
import type { Profile } from "@/types";

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", userId).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateAvatar(userId: string, file: File) {
  const path = await uploadAvatar(userId, file);
  return updateProfile(userId, { avatar_url: path });
}

export { AVATAR_BUCKET };
