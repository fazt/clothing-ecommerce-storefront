"use client";

import Image from "next/image";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  alt,
  isNew,
  isSale,
}: {
  images: string[];
  alt: string;
  isNew?: boolean;
  isSale?: boolean;
}) {
  const safeImages = images.length > 0 ? images : [""];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSrc = safeImages[activeIndex] ?? safeImages[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
        {activeSrc ? (
          <Image
            key={activeSrc}
            src={activeSrc}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute left-4 top-4 flex flex-col gap-1">
          {isNew && (
            <Badge className="bg-foreground text-background">Nuevo</Badge>
          )}
          {isSale && <Badge variant="destructive">Sale</Badge>}
        </div>
      </div>
      {safeImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.slice(0, 4).map((src, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-pressed={active}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md bg-muted ring-1 transition-all",
                  active
                    ? "ring-2 ring-foreground"
                    : "ring-border hover:ring-foreground/60",
                )}
              >
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
