// Server-side reads for Server Components. Mutations happen in the browser
// through `@/lib/api-client`; this module never writes.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type {
  AnalyticsSummary,
  ApiCategory,
  ApiCustomer,
  ApiDiscount,
  ApiOrder,
  ApiProduct,
  ApiUser,
  CategoryListParams,
  CustomerListParams,
  OrderListParams,
  Paginated,
  ProductListParams,
  UserListParams,
} from "./api-types";
import { toQueryString } from "./query-string";

export * from "./api-types";

export const AUTH_COOKIE = "auth-token";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";
const MAX_PAGE_SIZE = 100;

type Query = object;

async function authHeader(token?: string): Promise<Record<string, string>> {
  if (token) return { Authorization: `Bearer ${token}` };
  try {
    const store = await cookies();
    const value = store.get(AUTH_COOKIE)?.value;
    return value ? { Authorization: `Bearer ${value}` } : {};
  } catch {
    // Not in request context (e.g. module top-level). No auth header.
    return {};
  }
}

async function get<T>(path: string, params?: Query): Promise<T> {
  const headers = await authHeader();
  const res = await fetch(`${API_URL}${path}${toQueryString(params)}`, {
    cache: "no-store",
    headers,
  });
  if (res.status === 401 && headers.Authorization) {
    // Token expired or invalid on a server read — send the user to log in
    // again instead of surfacing a render-time error in the RSC.
    redirect("/login");
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

/** Walks every page of a collection. For aggregates (reports, catalog). */
async function getAll<T>(path: string, params?: Query): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await get<Paginated<T>>(path, {
      ...params,
      page,
      pageSize: MAX_PAGE_SIZE,
    });
    items.push(...data);
    if (page >= meta.totalPages) return items;
  }
}

export const productsApi = {
  listAll: (params?: ProductListParams) => getAll<ApiProduct>("/products", params),
  get: (id: string) => get<ApiProduct>(`/products/${id}`),
};

export const categoriesApi = {
  listAll: (params?: CategoryListParams) => getAll<ApiCategory>("/categories", params),
  get: (id: string) => get<ApiCategory>(`/categories/${id}`),
};

export const customersApi = {
  listAll: (params?: CustomerListParams) => getAll<ApiCustomer>("/customers", params),
  get: (id: string) => get<ApiCustomer>(`/customers/${id}`),
};

export const ordersApi = {
  listAll: (params?: OrderListParams) => getAll<ApiOrder>("/orders", params),
  get: (id: string) => get<ApiOrder>(`/orders/${id}`),
};

export const discountsApi = {
  get: (id: string) => get<ApiDiscount>(`/discounts/${id}`),
};

export const usersApi = {
  list: (params?: UserListParams) => get<Paginated<ApiUser>>("/users", params),
  get: (id: string) => get<ApiUser>(`/users/${id}`),
};

export const analyticsApi = {
  summary: () => get<AnalyticsSummary>("/analytics/summary"),
};

export const meApi = {
  get: async (token?: string) => {
    const res = await fetch(`${API_URL}/me`, {
      cache: "no-store",
      headers: await authHeader(token),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as ApiUser;
  },
  ordersAll: () => getAll<ApiOrder>("/me/orders"),
};
