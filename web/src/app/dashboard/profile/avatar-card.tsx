"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormAlert } from "@/components/form-message";
import { api } from "@/lib/api-client";
import type { ApiUser } from "@/lib/api-types";
import { uploadErrorMessage } from "@/lib/upload-error";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/avif,image/gif";

function initials(user: ApiUser): string {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function AvatarCard({ user }: { user: ApiUser }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string | null) {
    const updated = await api.me.update({ avatarUrl: next });
    setAvatarUrl(updated.avatarUrl);
    router.refresh();
  }

  async function onFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Solo se permiten imágenes.");
    if (file.size > MAX_BYTES) return setError("La imagen supera los 5 MB.");
    setPending(true);
    try {
      const { publicUrl } = await api.uploads.create(file, "avatars");
      await save(publicUrl);
    } catch (e) {
      setError(uploadErrorMessage(e));
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    setError(null);
    setPending(true);
    try {
      await save(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo quitar el avatar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="border-none bg-background/50 shadow-none ring-1 ring-border/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">Avatar</CardTitle>
        <CardDescription>JPG, PNG, WEBP, AVIF o GIF de hasta 5 MB.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar className="h-20 w-20">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="Tu avatar" /> : null}
            <AvatarFallback className="text-lg">{initials(user)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {avatarUrl ? "Cambiar avatar" : "Subir avatar"}
            </Button>
            {avatarUrl ? (
              <Button type="button" variant="ghost" onClick={onRemove} disabled={pending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Quitar
              </Button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) void onFile(file);
            }}
          />
        </div>
        <FormAlert message={error} />
      </CardContent>
    </Card>
  );
}
