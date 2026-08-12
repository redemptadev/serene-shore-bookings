import { supabase } from "@/integrations/supabase/client";
import type { AdminSettings } from "@/types";

export async function getSettings(): Promise<AdminSettings | null> {
  const { data, error } = await supabase.from("admin_settings").select("*").eq("id", true).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSettings(patch: Partial<AdminSettings>) {
  const { data, error } = await supabase
    .from("admin_settings")
    .update(patch)
    .eq("id", true)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
