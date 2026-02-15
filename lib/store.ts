export type OrderType = "PREBOOK" | "INSTANT"
export type OrderStatus = "PAID" | "PREPARING" | "READY" | "DELIVERED"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  emoji: string
  category: string
}

export interface Order {
  id: string
  studentName: string
  items: CartItem[]
  totalPrice: number
  orderType: OrderType
  status: OrderStatus
  timeSlot?: string
  estimatedReadyTime?: string
  queuePosition?: number
  createdAt: string
  updatedAt: string
}

export interface MenuItem {
  id: string
  name: string
  price: number
  description: string
  category: string
  emoji: string
}

export const MENU_ITEMS: MenuItem[] = [
  {
    id: "sandwich",
    name: "Sandwich",
    price: 60,
    description: "Freshly made grilled sandwich with veggies and cheese",
    category: "Snacks",
    emoji: "S",
  },
  {
    id: "burger",
    name: "Burger",
    price: 80,
    description: "Classic crispy burger with lettuce, tomato & special sauce",
    category: "Snacks",
    emoji: "B",
  },
  {
    id: "juice",
    name: "Fresh Juice",
    price: 40,
    description: "Freshly squeezed seasonal fruit juice",
    category: "Beverages",
    emoji: "J",
  },
  {
    id: "coffee",
    name: "Coffee",
    price: 30,
    description: "Hot brewed coffee with milk",
    category: "Beverages",
    emoji: "C",
  },
  {
    id: "dosa",
    name: "Masala Dosa",
    price: 50,
    description: "Crispy dosa with potato filling and chutney",
    category: "Meals",
    emoji: "D",
  },
  {
    id: "biryani",
    name: "Veg Biryani",
    price: 100,
    description: "Fragrant basmati rice with mixed vegetables and spices",
    category: "Meals",
    emoji: "V",
  },
]

export const TIME_SLOTS = [
  { id: "12-1230", label: "12:00 - 12:30 PM" },
  { id: "1230-100", label: "12:30 - 1:00 PM" },
  { id: "100-130", label: "1:00 - 1:30 PM" },
]

const MAX_ACTIVE_INSTANT_ORDERS = 15

// Persist store across HMR / serverless re-evaluations
const globalForStore = globalThis as unknown as { __srmcan_orders?: Map<string, Order> }
if (!globalForStore.__srmcan_orders) {
  globalForStore.__srmcan_orders = new Map<string, Order>()
}
const orders: Map<string, Order> = globalForStore.__srmcan_orders

function generateOrderId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = "SRM-"
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function getActiveInstantOrders(): Order[] {
  return Array.from(orders.values()).filter(
    (o) => o.orderType === "INSTANT" && o.status !== "DELIVERED"
  )
}

export function createOrder(
  studentName: string,
  items: CartItem[],
  orderType: OrderType,
  timeSlot?: string
): { success: boolean; order?: Order; error?: string } {
  if (!items || items.length === 0) {
    return { success: false, error: "No items in the order." }
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const now = new Date()

  if (orderType === "INSTANT") {
    const activeInstant = getActiveInstantOrders()
    if (activeInstant.length >= MAX_ACTIVE_INSTANT_ORDERS) {
      return {
        success: false,
        error: `Queue is full! Maximum ${MAX_ACTIVE_INSTANT_ORDERS} active instant orders allowed. Please try pre-booking instead.`,
      }
    }

    const queuePosition = activeInstant.length + 1
    const waitMinutes = queuePosition * 3
    const readyTime = new Date(now.getTime() + waitMinutes * 60000)

    const order: Order = {
      id: generateOrderId(),
      studentName,
      items,
      totalPrice,
      orderType: "INSTANT",
      status: "PREPARING",
      queuePosition,
      estimatedReadyTime: readyTime.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }

    orders.set(order.id, order)
    return { success: true, order }
  }

  // PREBOOK
  if (!timeSlot) {
    return { success: false, error: "Time slot is required for pre-book orders." }
  }

  const order: Order = {
    id: generateOrderId(),
    studentName,
    items,
    totalPrice,
    orderType: "PREBOOK",
    status: "PAID",
    timeSlot,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  orders.set(order.id, order)
  return { success: true, order }
}

export function verifyOrder(orderId: string): {
  success: boolean
  order?: Order
  error?: string
} {
  const order = orders.get(orderId.toUpperCase())
  if (!order) {
    return { success: false, error: "Order not found. Please check the Order ID." }
  }
  if (order.status === "DELIVERED") {
    return {
      success: false,
      error: "This order has already been delivered.",
    }
  }

  order.status = "DELIVERED"
  order.updatedAt = new Date().toISOString()
  orders.set(order.id, order)
  return { success: true, order }
}

export function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): { success: boolean; order?: Order; error?: string } {
  const order = orders.get(orderId.toUpperCase())
  if (!order) {
    return { success: false, error: "Order not found." }
  }

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PAID: ["PREPARING"],
    PREPARING: ["READY"],
    READY: ["DELIVERED"],
    DELIVERED: [],
  }

  if (!validTransitions[order.status].includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change status from ${order.status} to ${newStatus}.`,
    }
  }

  order.status = newStatus
  order.updatedAt = new Date().toISOString()
  orders.set(order.id, order)
  return { success: true, order }
}

export function getOrder(orderId: string): Order | undefined {
  return orders.get(orderId.toUpperCase())
}

export function getAllOrders(): {
  active: Order[]
  prebooked: Order[]
  delivered: Order[]
  all: Order[]
} {
  const allOrders = Array.from(orders.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return {
    active: allOrders.filter(
      (o) => o.status !== "DELIVERED" && o.orderType === "INSTANT"
    ),
    prebooked: allOrders.filter(
      (o) => o.orderType === "PREBOOK" && o.status !== "DELIVERED"
    ),
    delivered: allOrders.filter((o) => o.status === "DELIVERED"),
    all: allOrders,
  }
}

export function getStats() {
  const allOrders = Array.from(orders.values())
  const activeInstant = allOrders.filter(
    (o) => o.orderType === "INSTANT" && o.status !== "DELIVERED"
  ).length
  const activePrebooking = allOrders.filter(
    (o) => o.orderType === "PREBOOK" && o.status !== "DELIVERED"
  ).length
  const totalDelivered = allOrders.filter((o) => o.status === "DELIVERED").length
  const totalOrders = allOrders.length
  const totalRevenue = allOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((sum, o) => sum + o.totalPrice, 0)

  return {
    activeInstantOrders: activeInstant,
    activePrebooked: activePrebooking,
    maxInstantOrders: MAX_ACTIVE_INSTANT_ORDERS,
    totalDelivered,
    totalOrders,
    totalRevenue,
  }
}
