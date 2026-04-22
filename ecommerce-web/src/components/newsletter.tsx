import { Mail } from "lucide-react";

export function Newsletter() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
      <div className="bg-ink rounded-[20px] px-6 py-10 md:px-16 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-16">
          <h2 className="font-integral text-[color:var(--bg)] text-[32px] md:text-[40px] leading-[1.05] max-w-xl">
            STAY UPTO DATE ABOUT
            <br />
            OUR LATEST OFFERS
          </h2>
          <form className="flex w-full flex-col gap-3">
            <label
              className="flex items-center gap-3 rounded-full bg-white px-5 py-3.5"
            >
              <Mail className="h-5 w-5 shrink-0 text-[color:var(--ink-faded)]" strokeWidth={1.5} />
              <input
                type="email"
                required
                placeholder="Enter your email address"
                aria-label="Email"
                className="w-full bg-transparent text-[14px] text-black placeholder:text-gray-500 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-[14px] font-medium text-black transition-colors hover:bg-white/90"
            >
              Subscribe to Newsletter
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
