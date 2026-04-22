"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type Slide = {
  eyebrow: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
  bg: string;
  darkBg: string;
  fg: string;
  darkFg: string;
  circles: string;
};

const slides: Slide[] = [
  {
    eyebrow: "Best Deal Forever",
    title: "Best Fashion\nCollection",
    description:
      "There are many variations of passages of Lorem Ipsum available, but the majority.",
    cta: { label: "Get It Now", href: "/products" },
    image: {
      src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&auto=format&fit=crop&q=80",
      alt: "Best Fashion Collection",
    },
    bg: "bg-[#bde3e6]",
    darkBg: "dark:bg-[#2b4447]",
    fg: "text-[#1d3a55]",
    darkFg: "dark:text-white",
    circles: "bg-white/20",
  },
  {
    eyebrow: "Summer Essentials",
    title: "Elegance in\nEvery Thread",
    description:
      "Discover timeless pieces designed to move with you, season after season.",
    cta: { label: "Shop Now", href: "/products" },
    image: {
      src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop&q=80",
      alt: "Summer Essentials",
    },
    bg: "bg-[#f5d6c6]",
    darkBg: "dark:bg-[#4a3228]",
    fg: "text-[#5c2a1f]",
    darkFg: "dark:text-white",
    circles: "bg-white/25",
  },
  {
    eyebrow: "New Arrivals",
    title: "Street Style\nReimagined",
    description:
      "Fresh drops, bold silhouettes, and the edge your wardrobe has been waiting for.",
    cta: { label: "Explore", href: "/products" },
    image: {
      src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop&q=80",
      alt: "Street Style Reimagined",
    },
    bg: "bg-[#e0d7f0]",
    darkBg: "dark:bg-[#352a4a]",
    fg: "text-[#2d1b55]",
    darkFg: "dark:text-white",
    circles: "bg-white/25",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      6000,
    );
    return () => clearInterval(id);
  }, []);

  const active = slides[index];

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={`relative mx-auto w-full max-w-7xl overflow-hidden rounded-[2.5rem] transition-colors duration-700 ${active.bg} ${active.darkBg}`}
      >
        <div className="pointer-events-none absolute left-10 top-12 hidden grid-cols-8 gap-2 md:grid">
          {Array.from({ length: 56 }).map((_, i) => (
            <span
              key={`dot-tl-${i}`}
              className="h-1.5 w-1.5 rounded-full bg-white/70"
            />
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-10 right-10 hidden grid-cols-8 gap-2 md:grid">
          {Array.from({ length: 56 }).map((_, i) => (
            <span
              key={`dot-br-${i}`}
              className="h-1.5 w-1.5 rounded-full border border-white/80"
            />
          ))}
        </div>

        <div className="pointer-events-none absolute right-[15%] top-1/2 hidden -translate-y-1/2 md:block">
          <span
            className={`absolute inset-0 -m-48 rounded-full transition-colors duration-700 ${active.circles}`}
          />
          <span
            className={`absolute inset-0 -m-36 rounded-full transition-colors duration-700 ${active.circles}`}
          />
          <span
            className={`absolute inset-0 -m-24 rounded-full transition-colors duration-700 ${active.circles}`}
          />
        </div>

        <div className="relative">
          {slides.map((slide, i) => (
            <div
              key={slide.title}
              aria-hidden={i !== index}
              className={`grid items-center gap-8 px-6 py-12 sm:px-10 md:grid-cols-2 md:gap-4 md:py-16 lg:px-16 lg:py-24 ${
                i === index
                  ? "relative z-10 opacity-100"
                  : "pointer-events-none absolute inset-0 opacity-0"
              } transition-opacity duration-700`}
            >
              <div className="relative z-10 flex flex-col gap-6">
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.25em] ${slide.fg} ${slide.darkFg} opacity-90`}
                >
                  {slide.eyebrow}
                </span>
                <h1
                  className={`font-heading text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl ${slide.fg} ${slide.darkFg} whitespace-pre-line`}
                >
                  {slide.title}
                </h1>
                <p
                  className={`max-w-md text-base ${slide.fg} ${slide.darkFg} opacity-80`}
                >
                  {slide.description}
                </p>
                <div className="mt-2">
                  <Link
                    href={slide.cta.href}
                    className={`inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-sm font-semibold uppercase tracking-[0.15em] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.45)] ${slide.fg}`}
                  >
                    {slide.cta.label}
                  </Link>
                </div>
              </div>

              <div className="relative z-10 h-105 w-full md:h-130 lg:h-150">
                <Image
                  src={slide.image.src}
                  alt={slide.image.alt}
                  fill
                  priority={i === 0}
                  className="object-contain object-bottom"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {slides.map((slide, i) => {
            const isActive = i === index;
            return (
              <button
                key={slide.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                aria-current={isActive}
                className={`h-0.75 rounded-full transition-all duration-500 ${
                  isActive ? "w-10 bg-white" : "w-5 bg-white/50 hover:bg-white/70"
                }`}
              />
            );
          })}
        </div>

        <div
          className={`pointer-events-none absolute bottom-6 right-6 z-20 transition-colors duration-700 ${active.fg} ${active.darkFg}`}
        >
          <Sparkles className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>
    </section>
  );
}
