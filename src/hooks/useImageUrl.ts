import { useQuery } from "@tanstack/react-query";
import { resolveImageUrl } from "@/services/images";

export function useImageUrl(bucket: string, storagePath?: string | null, fallbackUrl?: string | null) {
  const { data } = useQuery({
    queryKey: ["image-url", bucket, storagePath ?? "", fallbackUrl ?? ""],
    queryFn: () => resolveImageUrl(bucket, storagePath, fallbackUrl),
    enabled: Boolean(storagePath || fallbackUrl),
    staleTime: 60_000 * 60,
  });
  return data ?? null;
}