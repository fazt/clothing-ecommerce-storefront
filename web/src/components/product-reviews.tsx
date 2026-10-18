"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api-client";
import type { ApiReview, MyReview, ReviewPage } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });

function Stars({ value, size = "h-4 w-4" }: { value: number; size?: string }) {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={size}
          fill={i < Math.round(value) ? "var(--star)" : "transparent"}
          style={{ color: "var(--star)" }}
          strokeWidth={i < Math.round(value) ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

export function ProductReviews({ productId, initial }: { productId: string; initial: ReviewPage | null }) {
  const [page, setPage] = useState<ReviewPage | null>(initial);
  const [reviews, setReviews] = useState<ApiReview[]>(initial?.data ?? []);
  const [mine, setMine] = useState<MyReview | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.reviews.mine(productId).then(
      (m) => {
        if (cancelled) return;
        setMine(m);
        setSignedIn(true);
      },
      (e: unknown) => {
        if (!cancelled) setSignedIn(e instanceof ApiError && e.status === 401 ? false : null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function reload() {
    const fresh = await api.reviews.list(productId, { page: 1, pageSize: 5 });
    setPage(fresh);
    setReviews(fresh.data);
  }

  async function loadMore() {
    if (!page) return;
    setLoadingMore(true);
    try {
      const next = await api.reviews.list(productId, { page: page.meta.page + 1, pageSize: page.meta.pageSize });
      setPage(next);
      setReviews((prev) => [...prev, ...next.data]);
    } finally {
      setLoadingMore(false);
    }
  }

  const summary = page?.summary;
  const hasMore = page ? page.meta.page < page.meta.totalPages : false;

  return (
    <section className="border-t hairline py-16 md:py-20" aria-labelledby="reviews-title">
      <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
        <div>
          <p className="label">— Opiniones</p>
          <h2 id="reviews-title" className="font-display mt-4 text-3xl font-light tracking-tight text-[color:var(--ink)]">
            Reseñas de clientes
          </h2>
          {summary && summary.count > 0 ? (
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-semibold">{summary.average.toFixed(1)}</span>
                <div>
                  <Stars value={summary.average} />
                  <p className="mt-1 text-xs text-muted-foreground">{summary.count} reseña(s)</p>
                </div>
              </div>
              <ul className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((r) => {
                  const n = summary.distribution[String(r)] ?? 0;
                  const pct = summary.count ? Math.round((n / summary.count) * 100) : 0;
                  return (
                    <li key={r} className="flex items-center gap-2 text-xs">
                      <span className="w-3 tabular-nums">{r}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: "var(--star)" }} />
                      </span>
                      <span className="w-8 text-right tabular-nums text-muted-foreground">{n}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Todavía no hay reseñas. ¡Sé la primera persona en opinar!</p>
          )}

          <div className="mt-8">
            {signedIn === false ? (
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="underline underline-offset-4">
                  Inicia sesión
                </Link>{" "}
                para dejar tu reseña.
              </p>
            ) : signedIn ? (
              <ReviewForm
                productId={productId}
                mine={mine}
                onSaved={async () => {
                  setMine(await api.reviews.mine(productId));
                  await reload();
                }}
              />
            ) : null}
          </div>
        </div>

        <div>
          {reviews.length === 0 ? null : (
            <ul className="divide-y hairline">
              {reviews.map((r) => (
                <li key={r.id} className="py-6 first:pt-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars value={r.rating} />
                    {r.title ? <p className="font-medium">{r.title}</p> : null}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--ink-soft)]">{r.body}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{r.user.name ?? "Cliente"}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={r.createdAt}>{dateFmt.format(new Date(r.createdAt))}</time>
                    {r.verified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <BadgeCheck className="h-3.5 w-3.5" /> Compra verificada
                      </span>
                    ) : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {hasMore ? (
            <Button variant="outline" className="mt-4" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ver más reseñas
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ReviewForm({
  productId,
  mine,
  onSaved,
}: {
  productId: string;
  mine: MyReview | null;
  onSaved: () => Promise<void>;
}) {
  const existing = mine?.review ?? null;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setMessage({ ok: false, text: "Elige de 1 a 5 estrellas." });
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      await api.reviews.save(productId, { rating, title: title || null, body });
      await onSaved();
      setMessage({ ok: true, text: existing ? "Reseña actualizada." : "¡Gracias por tu reseña!" });
    } catch (err) {
      const text =
        err instanceof ApiError ? (Object.values(err.fieldErrors)[0] ?? err.message) : "No se pudo guardar la reseña.";
      setMessage({ ok: false, text });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-medium">{existing ? "Edita tu reseña" : "Escribe una reseña"}</p>
      {existing?.status === "HIDDEN" ? (
        <p className="text-xs text-amber-700">Tu reseña está oculta por moderación.</p>
      ) : null}
      <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="rounded p-0.5"
          >
            <Star
              className={cn("h-6 w-6")}
              fill={n <= rating ? "var(--star)" : "transparent"}
              style={{ color: "var(--star)" }}
              strokeWidth={n <= rating ? 0 : 1.5}
            />
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-title">Título (opcional)</Label>
        <Input id="review-title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-body">Tu opinión</Label>
        <Textarea
          id="review-body"
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      {mine?.purchased ? (
        <p className="text-xs text-muted-foreground">Se mostrará como «compra verificada».</p>
      ) : null}
      {message ? (
        <p className={cn("text-xs", message.ok ? "text-emerald-700" : "text-destructive")} role="status">
          {message.text}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {existing ? "Guardar cambios" : "Publicar reseña"}
      </Button>
    </form>
  );
}
