import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-soft)" }}
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 pb-12 pt-10 sm:px-6 md:grid-cols-2 md:gap-10 md:pt-16 lg:px-8">
        {/* Left */}
        <div className="flex flex-col justify-center pt-4 md:pt-16">
          <h1 className="font-integral reveal text-[40px] sm:text-[52px] md:text-[56px] lg:text-[64px]">
            Find clothes
            <br />
            that matches
            <br />
            your style
          </h1>
          <p
            className="reveal mt-6 max-w-md text-[14px] md:text-[16px] leading-relaxed text-[color:var(--ink-soft)]"
            style={{ animationDelay: "0.1s" }}
          >
            Browse through our diverse range of meticulously crafted garments,
            designed to bring out your individuality and cater to your sense of
            style.
          </p>
          <div
            className="reveal mt-8"
            style={{ animationDelay: "0.2s" }}
          >
            <Link href="/products" className="btn-primary">
              Shop Now
            </Link>
          </div>

          {/* Stats */}
          <div
            className="reveal mt-10 flex flex-wrap items-center gap-8 md:gap-10"
            style={{ animationDelay: "0.3s" }}
          >
            <Stat value="200+" label="International Brands" />
            <div
              className="hidden h-14 w-px sm:block"
              style={{ backgroundColor: "var(--border)" }}
            />
            <Stat value="2,000+" label="High-Quality Products" />
            <div
              className="hidden h-14 w-px sm:block"
              style={{ backgroundColor: "var(--border)" }}
            />
            <Stat value="30,000+" label="Happy Customers" />
          </div>
        </div>

        {/* Right — image */}
        <div className="relative flex items-end justify-center md:justify-end">
          <div className="relative h-[360px] w-full sm:h-[460px] md:h-[580px]">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80"
              alt="Find clothes that match your style"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-top"
            />
            {/* Decorative star/asterisk */}
            <Star className="absolute -top-2 right-6 h-16 w-16 md:h-24 md:w-24" />
            <Star className="absolute bottom-24 left-2 h-10 w-10 md:h-16 md:w-16" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-bold text-[26px] md:text-[36px] lg:text-[40px] leading-none">
        {value}
      </p>
      <p className="mt-1 text-[12px] md:text-[14px] text-[color:var(--ink-soft)]">
        {label}
      </p>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden
    >
      <path
        d="M50 0L60 40L100 50L60 60L50 100L40 60L0 50L40 40L50 0Z"
        fill="var(--ink)"
      />
    </svg>
  );
}
