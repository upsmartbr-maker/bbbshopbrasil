"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { FALLBACK_PRODUCT_IMAGE, cn } from "@/lib/utils";

export interface ProductImageZoomProps {
  src: string | null | undefined;
  alt: string;
  images?: string[];
  activeIndex?: number;
  onSelectIndex?: (index: number) => void;
  zoomScale?: number;
  className?: string;
  badge?: React.ReactNode;
}

export function ProductImageZoom({
  src,
  alt,
  images = [],
  activeIndex = 0,
  onSelectIndex,
  zoomScale = 2.2,
  className,
  badge,
}: ProductImageZoomProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [origin, setOrigin] = React.useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [imgFailed, setImgFailed] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  const effectiveSrc =
    !imgFailed && src && src.trim().length > 0 ? src : FALLBACK_PRODUCT_IMAGE;

  React.useEffect(() => {
    setImgFailed(false);
    setIsZoomed(false);
  }, [src]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.max(0, Math.min(100, rawX));
    const y = Math.max(0, Math.min(100, rawY));

    setOrigin({ x, y });
    if (!isZoomed) {
      setIsZoomed(true);
    }
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      setIsZoomed(true);
    }
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    setOrigin({ x: 50, y: 50 });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsTouchDevice(true);
    setIsZoomed(false);
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      touchStartX.current === null ||
      touchStartY.current === null ||
      images.length <= 1 ||
      !onSelectIndex
    ) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Verifica se o gesto horizontal prevaleceu sobre a rolagem vertical
    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Swipe para a esquerda -> próxima foto
        const nextIdx = (activeIndex + 1) % images.length;
        onSelectIndex(nextIdx);
      } else {
        // Swipe para a direita -> foto anterior
        const prevIdx = (activeIndex - 1 + images.length) % images.length;
        onSelectIndex(prevIdx);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const canNavigate = images.length > 1 && Boolean(onSelectIndex);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "group relative aspect-square w-full select-none overflow-hidden rounded-2xl border border-nero/10 bg-[#FDFBF7] shadow-sm",
        isZoomed ? "cursor-zoom-out" : "cursor-zoom-in",
        className
      )}
    >
      {/* Imagem Principal com Transform Scale Suave */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={effectiveSrc}
        alt={alt}
        draggable={false}
        onError={() => setImgFailed(true)}
        style={{
          transform: isZoomed ? `scale(${zoomScale})` : "scale(1)",
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
        className={cn(
          "h-full w-full object-cover",
          isZoomed
            ? "transition-transform duration-75 ease-out"
            : "transition-transform duration-300 ease-out"
        )}
      />

      {/* Lente sutil seguidora do cursor no desktop */}
      {isZoomed && !isTouchDevice && (
        <div
          aria-hidden="true"
          style={{
            left: `${origin.x}%`,
            top: `${origin.y}%`,
          }}
          className="pointer-events-none absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C28E46]/60 bg-white/5 shadow-[0_0_0_1px_rgba(20,19,17,0.08)]"
        />
      )}

      {/* Badges de Desconto / Esgotado */}
      {badge}

      {/* Indicador de Zoom no Desktop */}
      {!isZoomed && (
        <div className="pointer-events-none absolute bottom-3.5 right-3.5 hidden items-center gap-1.5 rounded-full border border-nero/10 bg-[#FDFBF7]/90 px-3 py-1.5 text-[11px] font-medium text-nero/80 shadow-xs backdrop-blur-xs md:inline-flex">
          <ZoomIn className="h-3.5 w-3.5 text-[#C28E46]" />
          <span>Passe o mouse para ampliar</span>
        </div>
      )}

      {/* Setas de Navegação Rápida / Mobile Swipe */}
      {canNavigate && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectIndex?.(
                (activeIndex - 1 + images.length) % images.length
              );
            }}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-nero/10 bg-[#FDFBF7]/90 text-nero shadow-sm transition hover:border-[#C28E46] hover:bg-[#C28E46] hover:text-nero md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectIndex?.((activeIndex + 1) % images.length);
            }}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-nero/10 bg-[#FDFBF7]/90 text-nero shadow-sm transition hover:border-[#C28E46] hover:bg-[#C28E46] hover:text-nero md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Indicadores de Swipe em dispositivos móveis */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-nero/40 px-2.5 py-1 backdrop-blur-xs md:hidden">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Ir para foto ${idx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectIndex?.(idx);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  idx === activeIndex
                    ? "w-4 bg-[#C28E46]"
                    : "w-1.5 bg-[#FDFBF7]/70"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

