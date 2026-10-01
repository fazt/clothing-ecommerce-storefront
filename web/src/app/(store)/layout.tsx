import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CartProvider } from "@/components/cart-provider";
import { shopFontVariables } from "@/lib/fonts";
import { getSessionUser } from "@/lib/session";
import "./editorial.css";

export default async function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  return (
    <CartProvider>
      <div
        className={`shop-theme min-h-screen flex flex-col ${shopFontVariables}`}
      >
        <AnnouncementBar />
        <SiteHeader user={user} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
