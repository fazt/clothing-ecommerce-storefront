import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="relative mt-20"
      style={{ backgroundColor: "var(--bg-soft)" }}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 pt-16 pb-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <h2 className="font-integral text-[28px] mb-4">SHOP.CO</h2>
          <p className="text-[14px] text-[color:var(--ink-soft)] max-w-xs">
            We have clothes that suits your style and which you&apos;re proud
            to wear. From women to men.
          </p>
          <div className="mt-6 flex gap-3">
            <SocialLink href="#" label="Twitter">
              <IconTwitter />
            </SocialLink>
            <SocialLink href="#" label="Facebook">
              <IconFacebook />
            </SocialLink>
            <SocialLink href="#" label="Instagram">
              <IconInstagram />
            </SocialLink>
            <SocialLink href="#" label="Github">
              <IconGithub />
            </SocialLink>
          </div>
        </div>

        <FooterColumn
          title="COMPANY"
          links={[
            { label: "About", href: "#" },
            { label: "Features", href: "#" },
            { label: "Works", href: "#" },
            { label: "Career", href: "#" },
          ]}
        />

        <FooterColumn
          title="HELP"
          links={[
            { label: "Customer Support", href: "#" },
            { label: "Delivery Details", href: "#" },
            { label: "Terms & Conditions", href: "#" },
            { label: "Privacy Policy", href: "#" },
          ]}
        />

        <FooterColumn
          title="FAQ"
          links={[
            { label: "Account", href: "#" },
            { label: "Manage Deliveries", href: "#" },
            { label: "Orders", href: "#" },
            { label: "Payments", href: "#" },
          ]}
        />

        <FooterColumn
          title="RESOURCES"
          links={[
            { label: "Free eBook", href: "#" },
            { label: "Development Tutorial", href: "#" },
            { label: "How to — Blog", href: "#" },
            { label: "Youtube Playlist", href: "#" },
          ]}
        />
      </div>

      <div className="border-t hairline">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="text-[13px] text-[color:var(--ink-soft)]">
            Shop.co © 2000-{new Date().getFullYear()}, All Rights Reserved
          </p>
          <div className="flex gap-2">
            {["Visa", "Mastercard", "PayPal", "ApplePay", "GooglePay"].map(
              (method) => (
                <span
                  key={method}
                  className="inline-flex h-7 min-w-[46px] items-center justify-center rounded-md bg-white px-2 text-[10px] font-semibold text-[#1a1a2c]"
                  style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                >
                  {method}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-[14px] font-medium tracking-[0.2em] mb-5">{title}</h3>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[14px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--ink)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border hairline text-[color:var(--ink)] bg-white transition-colors hover:bg-[color:var(--ink)] hover:text-white"
    >
      {children}
    </Link>
  );
}

function IconTwitter() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.563 9.879v-6.986H7.898V12h2.539V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562V12h2.773l-.443 2.893h-2.33v6.986A10 10 0 0 0 22 12z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconGithub() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.01-.02-1.98-3.2.7-3.87-1.54-3.87-1.54-.53-1.34-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.18 1.17a11.03 11.03 0 0 1 5.79 0c2.2-1.48 3.17-1.17 3.17-1.17.63 1.6.23 2.78.11 3.07.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.15 0 1.55-.02 2.8-.02 3.18 0 .31.21.67.8.56A10.54 10.54 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
