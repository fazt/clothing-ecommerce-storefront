import { Archivo_Black, Manrope } from "next/font/google";

// Storefront fonts, shared by the store and auth layouts and by portaled
// store UI (e.g. the cart sheet), which renders outside the layout wrapper.
const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const shopFontVariables = `${display.variable} ${body.variable}`;
