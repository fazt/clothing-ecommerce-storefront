// Shapes returned by / sent to the Express API. Safe to import anywhere.

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
  avatarUrl: string | null;
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

export interface ProfileUpdateInput {
  name?: string | null;
  email?: string;
  avatarUrl?: string | null;
  /** Required by the API only when the email changes. */
  currentPassword?: string;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
}

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

export interface UploadResult {
  key: string;
  publicUrl: string;
}

export type UploadFolder = "products" | "categories" | "avatars";

// ---- Collections -----------------------------------------------------------

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface UserListParams extends ListParams {
  role?: Role;
}

export interface CategoryListParams extends ListParams {
  isVisible?: boolean;
}

export interface CustomerListParams extends ListParams {
  segment?: CustomerSegment;
}

export interface DiscountListParams extends ListParams {
  type?: DiscountType;
  status?: DiscountStatus;
}

export interface OrderListParams extends ListParams {
  status?: OrderStatus;
}

export type StockFilter = "in" | "low" | "out";

export interface ProductListParams extends ListParams {
  categoryId?: string;
  stock?: StockFilter;
}

// ---- Errors ----------------------------------------------------------------

export interface ApiFieldError {
  path: string;
  message: string;
}

export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: ApiFieldError[] | unknown;
}
