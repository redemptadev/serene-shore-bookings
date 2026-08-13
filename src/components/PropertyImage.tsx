import { PROPERTY_BUCKET } from "@/services/images";
import { useImageUrl } from "@/hooks/useImageUrl";
import { cn } from "@/lib/utils";
import { Waves } from "lucide-react";
import type { PropertyImage as PropertyImageRow } from "@/types";

interface Props {
  image?: Pick<PropertyImageRow, "url" | "storage_path" | "alt_text"> | null;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function PropertyImage({ image, alt, className, loading = "lazy" }: Props) {
  const url = useImageUrl(PROPERTY_BUCKET, image?.storage_path, image?.url);

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center gradient-surface text-muted-foreground", className)}>
        <Waves className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={image?.alt_text || alt || "Property photo"}
      loading={loading}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}