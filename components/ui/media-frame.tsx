import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFrameProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Texto exibido quando ainda não há imagem. */
  placeholderLabel?: string;
}

/** Imagem otimizada com placeholder elegante quando não há arquivo. */
export function MediaFrame({ src, alt, className, sizes, priority, placeholderLabel }: MediaFrameProps) {
  return (
    <div className={cn("relative overflow-hidden bg-marmo", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 50vw, 100vw"}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-marmo to-champagne/30 text-champagne-deep"
        >
          <ImageIcon className="h-8 w-8" aria-hidden="true" />
          {placeholderLabel && <span className="px-4 text-center text-xs font-semibold uppercase tracking-widest">{placeholderLabel}</span>}
        </div>
      )}
    </div>
  );
}

