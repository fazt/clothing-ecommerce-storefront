// Browser client for the Express API. Requests go straight to the API origin
// with `credentials: "include"`, so the HttpOnly auth cookie the API issues
// travels with them. Use it from Client Components only.
import type {
  ApiCategory,
  ApiCustomer,
  ApiDiscount,
  ApiErrorBody,
  ApiFieldError,
  ApiOrder,
  ApiProduct,
  ApiUser,
  AuthResponse,
  CategoryInput,
  CategoryListParams,
  CustomerInput,
  CustomerListParams,
  DiscountInput,
  DiscountListParams,
  ListParams,
  LoginInput,
  OrderListParams,
  OrderStatus,
  Paginated,
  PasswordChangeInput,
  PaypalCreateResult,
  PaypalItemInput,
  ProductInput,
  ProductListParams,
  ProfileUpdateInput,
  RegisterInput,
  UploadFolder,
  UploadResult,
  UserCreateInput,
  UserListParams,
  UserUpdateInput,
} from "./api-types";
import { toQueryString } from "./query-string";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** Field path → first message, from the API's Zod validation details. */
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, body: Partial<ApiErrorBody>) {
    super(body.error || `Error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.fieldErrors = {};
    if (Array.isArray(body.details)) {
      for (const detail of body.details as ApiFieldError[]) {
        if (detail?.path && !(detail.path in this.fieldErrors)) {
          this.fieldErrors[detail.path] = detail.message;
        }
      }
    }
  }
}

type Query = object;

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; query?: Query; form?: FormData } = {},
): Promise<T> {
  const { body, query, form } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${toQueryString(query)}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, { error: "No se pudo conectar con la API. Revisa tu conexión." });
  }
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as Partial<ApiErrorBody>;
    throw new ApiError(res.status, payload);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const get = <T>(path: string, query?: Query) => request<T>("GET", path, { query });
const post = <T>(path: string, body?: unknown) => request<T>("POST", path, { body });
const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, { body });
const put = <T>(path: string, body: unknown) => request<T>("PUT", path, { body });
const del = (path: string) => request<void>("DELETE", path);

function crud<T, Params extends ListParams, CreateInput, UpdateInput>(base: string) {
  return {
    list: (params?: Params) => get<Paginated<T>>(base, params),
    get: (id: string) => get<T>(`${base}/${id}`),
    create: (data: CreateInput) => post<T>(base, data),
    update: (id: string, data: UpdateInput) => patch<T>(`${base}/${id}`, data),
    remove: (id: string) => del(`${base}/${id}`),
  };
}

export const api = {
  auth: {
    login: (data: LoginInput) => post<AuthResponse>("/auth/login", data),
    register: (data: RegisterInput) => post<AuthResponse>("/auth/register", data),
    logout: () => post<void>("/auth/logout"),
    forgotPassword: (email: string) => post<{ ok: true }>("/auth/forgot-password", { email }),
    resetPassword: (token: string, password: string) =>
      post<{ ok: true }>("/auth/reset-password", { token, password }),
  },

  me: {
    get: () => get<ApiUser>("/me"),
    update: (data: ProfileUpdateInput) => patch<ApiUser>("/me", data),
    changePassword: (data: PasswordChangeInput) => put<void>("/me/password", data),
    orders: (params?: ListParams) => get<Paginated<ApiOrder>>("/me/orders", params),
  },

  users: crud<ApiUser, UserListParams, UserCreateInput, UserUpdateInput>("/users"),
  categories: crud<ApiCategory, CategoryListParams, CategoryInput, Partial<CategoryInput>>(
    "/categories",
  ),
  customers: crud<ApiCustomer, CustomerListParams, CustomerInput, Partial<CustomerInput>>(
    "/customers",
  ),
  discounts: crud<ApiDiscount, DiscountListParams, DiscountInput, Partial<DiscountInput>>(
    "/discounts",
  ),
  products: crud<ApiProduct, ProductListParams, ProductInput, Partial<ProductInput>>(
    "/products",
  ),
  orders: {
    list: (params?: OrderListParams) => get<Paginated<ApiOrder>>("/orders", params),
    get: (id: string) => get<ApiOrder>(`/orders/${id}`),
    updateStatus: (id: string, status: OrderStatus) => patch<ApiOrder>(`/orders/${id}`, { status }),
    remove: (id: string) => del(`/orders/${id}`),
  },

  uploads: {
    create: (file: File, folder: UploadFolder) => {
      const form = new FormData();
      form.append("file", file, file.name || `pasted-${Date.now()}.png`);
      form.append("folder", folder);
      return request<UploadResult>("POST", "/uploads", { form });
    },
  },

  payments: {
    createPaypalOrder: (items: PaypalItemInput[]) =>
      post<PaypalCreateResult>("/payments/paypal/orders", { items }),
    capturePaypalOrder: (paypalOrderId: string) =>
      post<ApiOrder>(`/payments/paypal/orders/${encodeURIComponent(paypalOrderId)}/capture`),
  },
};
