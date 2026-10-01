const brands = [
  { name: "VERSACE", font: "'Times New Roman', serif" },
  { name: "ZARA", font: "'Archivo', sans-serif" },
  { name: "GUCCI", font: "'Times New Roman', serif" },
  { name: "PRADA", font: "'Archivo Black', sans-serif" },
  { name: "Calvin Klein", font: "'Archivo', sans-serif" },
];

export function BrandStrip() {
  return (
    <section className="bg-ink py-8 px-4">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-x-16 gap-y-6 sm:gap-x-20 md:gap-x-24">
        {brands.map((b) => (
          <span
            key={b.name}
            className="text-[color:var(--bg)] text-[22px] md:text-[28px] font-bold tracking-tight"
            style={{ fontFamily: b.font }}
          >
            {b.name}
          </span>
        ))}
      </div>
    </section>
  );
}
