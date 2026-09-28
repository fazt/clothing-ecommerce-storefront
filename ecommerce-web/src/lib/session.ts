import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, meApi, type ApiUser } from "@/lib/api";

// The API issues and clears the auth cookie; the web app only reads it.
export async function getAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<ApiUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    return await meApi.get(token);
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
