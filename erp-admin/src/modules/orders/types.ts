export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderChannel = 'ONLINE' | 'ADMIN' | 'PHONE' | 'WHATSAPP';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
export type DeliveryType = 'DELIVERY' | 'PICKUP';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  bundleId: string | null;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedById: string | null;
  changedByName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  companyId: string;
  branchId: string | null;
  storeId: string | null;
  store?: { id: string; name: string } | null;
  orderNumber: string;
  channel: OrderChannel;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryType: DeliveryType;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryZip: string | null;
  deliveryReference: string | null;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  currencyCode: string;
  assignedToId: string | null;
  notes: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemPayload {
  productId?: string;
  bundleId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPriceCents: number;
  notes?: string;
}

export interface CreateOrderPayload {
  channel: OrderChannel;
  deliveryType: DeliveryType;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerNotes?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryReference?: string;
  discountCents?: number;
  taxCents?: number;
  shippingCents?: number;
  currencyCode: string;
  notes?: string;
  branchId?: string;
  storeId?: string;
  assignedToId?: string;
  items: CreateOrderItemPayload[];
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  notes?: string;
}

export interface UpdatePaymentStatusPayload {
  paymentStatus: PaymentStatus;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  channel?: OrderChannel;
  paymentStatus?: PaymentStatus;
  branchId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// State machine — valid transitions mirrored from backend
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'SHIPPED', 'CANCELLED'],
  READY_FOR_PICKUP: ['DELIVERED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  READY_FOR_PICKUP: 'Listo para recoger',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = {
  ONLINE: 'Tienda Online',
  ADMIN: 'Admin',
  PHONE: 'Teléfono',
  WHATSAPP: 'WhatsApp',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Sin pagar',
  PARTIAL: 'Parcial',
  PAID: 'Pagado',
  REFUNDED: 'Reembolsado',
};

export function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(cents / 100);
}
