"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClipboardPaste, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadImageAction } from "@/app/dashboard/(admin)/products/upload-actions";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif,image/gif";

export function ImageUpload({
  name,
  defaultValue = "",
  folder = "products",
}: {
  name: string;
  defaultValue?: string;
  folder?: string;
}) {
  const [url, setUrl] = useState<string>(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Solo se permiten imágenes.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(
          `La imagen supera los ${(MAX_BYTES / 1024 / 1024).toFixed(0)} MB.`,
        );
        return;
      }
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file, file.name || `pasted-${Date.now()}.png`);
        form.append("folder", folder);
        const result = await uploadImageAction(form);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setUrl(result.publicUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al subir la imagen.");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [folder],
  );

  // Paste from clipboard (document-wide, only reacts to image items)
  useEffect(() => {
    function onPaste(ev: ClipboardEvent) {
      if (uploading) return;
      const items = ev.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            ev.preventDefault();
            void handleFile(file);
            return;
          }
        }
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFile, uploading]);

  function clear() {
    setUrl("");
    setError(null);
  }

  function onDragEnter(ev: React.DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    dragCounter.current += 1;
    if (ev.dataTransfer?.types?.includes("Files")) setDragging(true);
  }
  function onDragOver(ev: React.DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
  }
  function onDragLeave(ev: React.DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragging(false);
  }
  function onDrop(ev: React.DragEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    dragCounter.current = 0;
    setDragging(false);
    const file = ev.dataTransfer?.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={url} />

      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && !url && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Subir imagen: click, arrastra y suelta o pega desde el portapapeles"
        className={cn(
          "relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-muted/20 p-5 text-center transition-colors",
          dragging
            ? "border-foreground bg-foreground/5"
            : "border-border hover:border-foreground/50 hover:bg-muted/40",
          uploading && "cursor-wait opacity-70",
          url && "p-3",
        )}
      >
        {url ? (
          <div className="flex w-full items-center gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-background ring-1 ring-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="preview"
                className="h-full w-full object-cover"
              />
              {uploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : null}
            </div>
            <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground break-all">
                Imagen lista. Puedes arrastrar otra para reemplazarla.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  disabled={uploading}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Reemplazar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    clear();
                  }}
                  disabled={uploading}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" />
                  Quitar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-border",
                dragging && "bg-foreground text-background ring-foreground",
              )}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {uploading
                  ? "Subiendo imagen..."
                  : dragging
                    ? "Suelta para subir"
                    : "Arrastra y suelta una imagen aquí"}
              </p>
              <p className="text-xs text-muted-foreground">
                o haz click para seleccionar · también puedes pegar con{" "}
                <kbd className="rounded border bg-background px-1 py-0.5 text-[10px] font-mono">
                  Ctrl
                </kbd>
                +
                <kbd className="rounded border bg-background px-1 py-0.5 text-[10px] font-mono">
                  V
                </kbd>
              </p>
              <p className="text-[10px] text-muted-foreground">
                JPG, PNG, WEBP o AVIF · hasta {(MAX_BYTES / 1024 / 1024).toFixed(0)} MB
              </p>
            </div>
            <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground">
              <ClipboardPaste className="h-3 w-3" />
              Paste OK
            </div>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      <Input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.currentTarget.value)}
        placeholder="O pega una URL directamente"
      />

      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
