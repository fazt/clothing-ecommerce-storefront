import { cookies } from "next/headers";

export interface ApiCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProductVariant {
  id: string;
  productId: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  price: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  images: string[];
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category: ApiCategoryRef | null;
  variants: ApiProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantInput {
  id?: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  stock?: number;
  price?: number | string | null;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number | string;
  stock?: number;
  imageUrl?: string | null;
  images?: string[];
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
  categoryId?: string | null;
  variants?: ProductVariantInput[];
}

export interface ApiCategory {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface CategoryInput {
  slug: string;
  name: string;
  image?: string | null;
  isVisible?: boolean;
}

export type CustomerSegment = "new" | "returning" | "vip";

export interface ApiCustomer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string | null;
  segment: CustomerSegment;
}

export interface CustomerInput {
  email: string;
  name: string;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface ApiOrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  sizeLabel: string | null;
  colorLabel: string | null;
  quantity: number;
  unitPrice: string;
  product: { id: string; name: string; imageUrl: string | null };
}

export interface ApiOrder {
  id: string;
  customerId: string;
  customer: { id: string; name: string; email: string };
  status: OrderStatus;
  paymentMethod: string;
  total: string;
  items: ApiOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number | string;
  variantId?: string | null;
  sizeLabel?: string | null;
  colorLabel?: string | null;
}

export interface OrderInput {
  customerId: string;
  paymentMethod: string;
  status?: OrderStatus;
  items: OrderItemInput[];
}

export type DiscountType = "PERCENT" | "FIXED" | "SHIPPING";
export type DiscountStatus = "ACTIVE" | "SCHEDULED" | "EXPIRED";

export interface ApiDiscount {
  id: string;
  code: string;
  description: string | null;
  type: DiscountType;
  value: string;
  usesCount: number;
  limit: number | null;
  status: DiscountStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountInput {
  code: string;
  description?: string | null;
  type: DiscountType;
  value: number | string;
  limit?: number | null;
  status?: DiscountStatus;
  expiresAt?: string | null;
}

export interface AnalyticsMetric {
  current: number;
  previous: number;
  change: number;
}

export interface AnalyticsTopProduct {
  productId: string;
  name: string;
  sold: number;
  revenue: number;
}

export interface AnalyticsSummary {
  metrics: {
    revenue: AnalyticsMetric;
    orders: AnalyticsMetric;
    newCustomers: AnalyticsMetric;
    conversionRate: AnalyticsMetric;
  };
  salesSeries: number[];
  topProducts: AnalyticsTopProduct[];
}

export type Role = "USER" | "ADMIN";

export interface ApiUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface UserCreateInput {
  email: string;
  password: string;
  name?: string | null;
  role?: Role;
}

export interface UserUpdateInput {
  name?: string | null;
  role?: Role;
  password?: string;
}

export const AUTH_COOKIE = "auth-token";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

async function authHeader(override?: string): Promise<Record<string, string>> {
  if (override) return { Authorization: `Bearer ${override}` };
  try {
    const store = await cookies();
    const token = store.get(AUTH_COOKIE)?.value;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    // Not in request context (e.g. module top-level). No auth header.
    return {};
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = { ...(init?.headers ?? {}), ...(await authHeader()) };
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers,
  });
  return handle<T>(res);
}

async function send<T>(method: string, path: string, body?: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader(token)),
  };
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handle<T>(res);
}

export const productsApi = {
  list: () => get<ApiProduct[]>("/products"),
  get: (id: string) => get<ApiProduct>(`/products/${id}`),
  create: (data: ProductInput) => send<ApiProduct>("POST", "/products", data),
  update: (id: string, data: Partial<ProductInput>) =>
    send<ApiProduct>("PUT", `/products/${id}`, data),
  remove: (id: string) => send<void>("DELETE", `/products/${id}`),
};

export const categoriesApi = {
  list: () => get<ApiCategory[]>("/categories"),
  get: (id: string) => get<ApiCategory>(`/categories/${id}`),
  create: (data: CategoryInput) =>
    send<ApiCategory>("POST", "/categories", data),
  update: (id: string, data: Partial<CategoryInput>) =>
    send<ApiCategory>("PUT", `/categories/${id}`, data),
  remove: (id: string) => send<void>("DELETE", `/categories/${id}`),
};

export const customersApi = {
  list: () => get<ApiCustomer[]>("/customers"),
  get: (id: string) => get<ApiCustomer>(`/customers/${id}`),
  create: (data: CustomerInput) =>
    send<ApiCustomer>("POST", "/customers", data),
  update: (id: string, data: Partial<CustomerInput>) =>
    send<ApiCustomer>("PUT", `/customers/${id}`, data),
  remove: (id: string) => send<void>("DELETE", `/customers/${id}`),
};

export const ordersApi = {
  list: () => get<ApiOrder[]>("/orders"),
  listMine: () => get<ApiOrder[]>("/orders/mine"),
  get: (id: string) => get<ApiOrder>(`/orders/${id}`),
  create: (data: OrderInput) => send<ApiOrder>("POST", "/orders", data),
  updateStatus: (id: string, status: OrderStatus) =>
    send<ApiOrder>("PATCH", `/orders/${id}/status`, { status }),
  remove: (id: string) => send<void>("DELETE", `/orders/${id}`),
};

export interface PaypalCreateResult {
  orderId: string;
  paypalOrderId: string;
  approveUrl: string;
}

export interface PaypalItemInput {
  productId: string;
  quantity: number;
  variantId?: string | null;
  sizeLabel?: string | null;
  colorLabel?: string | null;
}

export const paymentsApi = {
  createPaypal: (items: PaypalItemInput[]) =>
    send<PaypalCreateResult>("POST", "/payments/paypal/create", { items }),
  capturePaypal: (paypalOrderId: string) =>
    send<ApiOrder>("POST", "/payments/paypal/capture", { paypalOrderId }),
};

export interface UploadResult {
  key: string;
  publicUrl: string;
}

export const discountsApi = {
  list: () => get<ApiDiscount[]>("/discounts"),
  get: (id: string) => get<ApiDiscount>(`/discounts/${id}`),
  create: (data: DiscountInput) =>
    send<ApiDiscount>("POST", "/discounts", data),
  update: (id: string, data: Partial<DiscountInput>) =>
    send<ApiDiscount>("PUT", `/discounts/${id}`, data),
  remove: (id: string) => send<void>("DELETE", `/discounts/${id}`),
};

export const analyticsApi = {
  summary: () => get<AnalyticsSummary>("/analytics/summary"),
};

export const usersApi = {
  list: () => get<ApiUser[]>("/users"),
  get: (id: string) => get<ApiUser>(`/users/${id}`),
  create: (data: UserCreateInput) => send<ApiUser>("POST", "/users", data),
  update: (id: string, data: UserUpdateInput) =>
    send<ApiUser>("PUT", `/users/${id}`, data),
  remove: (id: string) => send<void>("DELETE", `/users/${id}`),
};

export const authApi = {
  login: (data: LoginInput) => send<AuthResponse>("POST", "/auth/login", data),
  register: (data: RegisterInput) =>
    send<AuthResponse>("POST", "/auth/register", data),
  forgotPassword: (email: string) =>
    send<{ ok: true }>("POST", "/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    send<{ ok: true }>("POST", "/auth/reset-password", { token, password }),
  me: (token?: string) => {
    if (token) {
      return fetch(`${API_URL}/auth/me`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      }).then(handle<ApiUser>);
    }
    return get<ApiUser>("/auth/me");
  },
};
