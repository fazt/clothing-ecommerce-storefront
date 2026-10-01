"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah M.",
    verified: true,
    rating: 5,
    body:
      "“I'm blown away by the quality and style of the clothes I received from Shop.co. From casual wear to elegant dresses, every piece I've bought has exceeded my expectations.”",
  },
  {
    name: "Alex K.",
    verified: true,
    rating: 5,
    body:
      "“Finding clothes that align with my personal style used to be a challenge until I discovered Shop.co. The range of options they offer is truly remarkable, catering to a variety of tastes and occasions.”",
  },
  {
    name: "James L.",
    verified: true,
    rating: 5,
    body:
      "“As someone who's always on the lookout for unique fashion pieces, I'm thrilled to have stumbled upon Shop.co. The selection of clothes is not only diverse but also on-point with every trend.”",
  },
  {
    name: "Marta S.",
    verified: true,
    rating: 5,
    body:
      "“Shop.co has become my go-to store for anything stylish. The fabrics feel premium and every order arrives perfectly packaged — it's the small things that make a difference.”",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const visible = 3;
  const max = Math.max(0, testimonials.length - visible);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <header className="mb-10 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="font-integral text-[32px] md:text-[48px] leading-none">
          Our happy customers
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--bg-soft)]"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => setIndex((i) => Math.min(max, i + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--bg-soft)]"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="overflow-hidden">
        <div
          className="flex gap-6 transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(calc(-${index} * (100% / 3 + 0.75rem)))`,
          }}
        >
          {testimonials.map((t, i) => (
            <article
              key={i}
              className="shrink-0 basis-full md:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)] rounded-[20px] border p-6 md:p-8 hairline"
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`h-5 w-5 ${s < t.rating ? "star fill-current" : "text-[color:var(--ink-faded)]"}`}
                    style={s < t.rating ? { color: "var(--star)" } : undefined}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="font-bold text-lg">{t.name}</span>
                {t.verified ? (
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M12 2L14.39 5.42L18.47 6.18L15.38 9.35L16.12 13.75L12 11.77L7.88 13.75L8.62 9.35L5.53 6.18L9.61 5.42L12 2Z"
                      fill="#01AB31"
                    />
                    <path
                      d="M10 13l2 2 4-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </div>
              <p className="text-[15px] leading-relaxed text-[color:var(--ink-soft)]">
                {t.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
