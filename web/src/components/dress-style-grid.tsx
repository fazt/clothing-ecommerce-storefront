import Image from "next/image";
import Link from "next/link";

const styles = [
  {
    name: "Casual",
    href: "/products",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80",
    className: "md:col-span-1 lg:col-span-4",
  },
  {
    name: "Formal",
    href: "/products",
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=900&auto=format&fit=crop&q=80",
    className: "md:col-span-2 lg:col-span-6",
  },
  {
    name: "Party",
    href: "/products",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop&q=80",
    className: "md:col-span-2 lg:col-span-6",
  },
  {
    name: "Gym",
    href: "/products",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop&q=80",
    className: "md:col-span-1 lg:col-span-4",
  },
];

export function DressStyleGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div
        className="rounded-[40px] px-6 py-14 md:px-16 md:py-20"
        style={{ backgroundColor: "var(--bg-soft)" }}
      >
        <h2 className="font-integral text-center text-[32px] md:text-[48px] mb-10 md:mb-14">
          Browse by dress style
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-10">
          {styles.map((s) => (
            <Link
              key={s.name}
              href={s.href}
              className={`group relative block overflow-hidden rounded-[24px] bg-white aspect-[16/9] md:aspect-auto md:h-[260px] ${s.className}`}
            >
              <Image
                src={s.image}
                alt={s.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span
                className="absolute left-6 top-6 text-[24px] md:text-[32px] font-semibold leading-none"
                style={{ color: "#000" }}
              >
                {s.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
