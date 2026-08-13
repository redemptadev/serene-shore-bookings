import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/services/settings";

export function useSettings() {
  return useQuery({ queryKey: ["admin-settings"], queryFn: getSettings, staleTime: 60_000 });
}