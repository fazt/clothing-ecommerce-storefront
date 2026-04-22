import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, authApi, type ApiUser } from "@/lib/api";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export async function getAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}

export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<ApiUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    return await authApi.me(token);
  } catch {
    return null;
  }
}

export async function requireAdminPage(): Promise<ApiUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  if (user.role !== "ADMIN") redirect("/dashboard/my-orders");
  return user;
}
