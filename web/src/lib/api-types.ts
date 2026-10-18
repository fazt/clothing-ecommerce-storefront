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
  ratingAvg: number;
  ratingCount: number;
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
  | "CANCELLED"
  | "REFUNDED";

export type PaymentProviderId = "STRIPE" | "PAYPAL" | "MERCADOPAGO" | "SIMULATED";

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
  /** Número legible (#1001). */
  number: number;
  customerId: string;
  customer: { id: string; name: string; email: string };
  status: OrderStatus;
  paymentMethod: string;
  provider: PaymentProviderId | null;
  currency: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  total: string;
  couponCode: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  trackingNumber: string | null;
  shippingMethod: { id: string; name: string; minDays: number; maxDays: number } | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingRegion: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
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
  minSubtotal: string | null;
  status: DiscountStatus;
  startsAt: string | null;
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
  minSubtotal?: number | string | null;
  status?: DiscountStatus;
  startsAt?: string | null;
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

/** Sign-in providers with credentials on the API (`GET /auth/providers`). */
export interface AuthProviders {
  google: boolean;
  github: boolean;
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

/** Pasarela activa en la API (solo aparecen las que tienen credenciales). */
export interface PaymentMethod {
  id: PaymentProviderId;
  label: string;
}

export interface PaymentMethods {
  methods: PaymentMethod[];
}

/** Línea del carrito que se envía a la API; los precios los calcula el servidor. */
export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  variantId?: string | null;
}

export interface QuoteInput {
  items: CheckoutItemInput[];
  couponCode?: string | null;
  shippingMethodId?: string | null;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  costCents: number;
  freeOverCents: number | null;
  minDays: number;
  maxDays: number;
}

export interface QuoteLine {
  productId: string;
  variantId: string | null;
  name: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  imageUrl: string | null;
  quantity: number;
  unitCents: number;
  totalCents: number;
  available: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  shippingMethod: ShippingOption | null;
  shippingMethods: ShippingOption[];
  coupon: { id: string; code: string; type: DiscountType; description: string | null } | null;
  couponError: string | null;
}

export interface ShippingAddressInput {
  name: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  country: string;
}

export interface CheckoutInput extends QuoteInput {
  provider: PaymentProviderId;
  shipping: ShippingAddressInput;
}

export interface CheckoutResult {
  orderId: string;
  number: number;
  provider: PaymentProviderId;
  url: string;
}

export interface ApiShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: string;
  freeOver: string | null;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  sortOrder: number;
  _count?: { orders: number };
}

export interface ShippingMethodInput {
  name: string;
  description?: string | null;
  price: number | string;
  freeOver?: number | string | null;
  minDays: number;
  maxDays: number;
  isActive: boolean;
  sortOrder: number;
}

export type ReviewStatus = "PUBLISHED" | "HIDDEN";

export interface ApiReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  createdAt: string;
  user: { name: string | null; avatarUrl: string | null };
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

export interface ReviewPage extends Paginated<ApiReview> {
  summary: ReviewSummary;
}

export interface MyReview {
  review: { id: string; rating: number; title: string | null; body: string; status: ReviewStatus } | null;
  purchased: boolean;
}

export interface ReviewInput {
  rating: number;
  title?: string | null;
  body: string;
}

export interface ApiAdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  status: ReviewStatus;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  product: { id: string; name: string; imageUrl: string | null };
}

export interface ReviewListParams extends ListParams {
  status?: ReviewStatus;
}

export interface WishlistEntry {
  addedAt: string;
  product: ApiProduct;
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
