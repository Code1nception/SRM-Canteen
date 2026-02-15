"use client"

import { useState, useEffect, useCallback } from "react"
import type { Order, OrderStatus } from "@/lib/store"
import { TIME_SLOTS } from "@/lib/store"
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  PackageCheck,
  Activity,
  ShoppingBag,
  Clock,
  CalendarClock,
  Flame,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  IndianRupee,
  LayoutDashboard,
  ClipboardList,
  BookmarkCheck,
  Truck,
  AlertCircle,
} from "lucide-react"

type DashboardTab = "overview" | "active" | "prebooked" | "delivered"

interface DashboardData {
  orders: {
    active: Order[]
    prebooked: Order[]
    delivered: Order[]
    all: Order[]
  }
  stats: {
    activeInstantOrders: number
    activePrebooked: number
    maxInstantOrders: number
    totalDelivered: number
    totalOrders: number
    totalRevenue: number
  }
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; next?: OrderStatus; nextLabel?: string }
> = {
  PAID: {
    label: "Paid",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    next: "PREPARING",
    nextLabel: "Start Preparing",
  },
  PREPARING: {
    label: "Preparing",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    next: "READY",
    nextLabel: "Mark Ready",
  },
  READY: {
    label: "Ready",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    next: "DELIVERED",
    nextLabel: "Mark Delivered",
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-muted-foreground",
    bg: "bg-secondary/50",
  },
}

function formatItems(order: Order): string {
  if (order.items && order.items.length > 0) {
    return order.items.map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ")
  }
  return "N/A"
}

function formatItemsShort(order: Order): string {
  if (order.items && order.items.length > 0) {
    const first = order.items[0]
    const rest = order.items.length - 1
    return `${first.name}${first.quantity > 1 ? ` x${first.quantity}` : ""}${rest > 0 ? ` +${rest} more` : ""}`
  }
  return "N/A"
}

export function StaffMode({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<DashboardTab>("overview")
  const [data, setData] = useState<DashboardData | null>(null)
  const [searchId, setSearchId] = useState("")
  const [searchResult, setSearchResult] = useState<{
    success: boolean
    message: string
    order?: Order
  } | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/orders/all")
      const json = await res.json()
      setData(json)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 4000)
    return () => clearInterval(interval)
  }, [fetchData])

  async function handleRefresh() {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => setRefreshing(false), 600)
  }

  async function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
    try {
      const res = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        await fetchData()
      }
    } catch {
      // silently fail
    }
  }

  async function handleVerify() {
    if (!searchId.trim()) return
    setSearchLoading(true)
    setSearchResult(null)

    try {
      const res = await fetch("/api/orders/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: searchId.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSearchResult({
          success: true,
          message: "Order verified and marked as DELIVERED!",
          order: json.order,
        })
        await fetchData()
      } else {
        setSearchResult({ success: false, message: json.error || "Verification failed." })
      }
    } catch {
      setSearchResult({ success: false, message: "Network error." })
    } finally {
      setSearchLoading(false)
    }
  }

  const stats = data?.stats
  const orders = data?.orders

  const sidebarItems: { id: DashboardTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-5 w-5" /> },
    {
      id: "active",
      label: "Active Orders",
      icon: <ClipboardList className="h-5 w-5" />,
      count: orders?.active.length,
    },
    {
      id: "prebooked",
      label: "Pre-booked",
      icon: <BookmarkCheck className="h-5 w-5" />,
      count: orders?.prebooked.length,
    },
    {
      id: "delivered",
      label: "Delivered",
      icon: <Truck className="h-5 w-5" />,
      count: orders?.delivered.length,
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card lg:flex">
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-5">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">SRMCAN</h1>
            <p className="text-xs text-muted-foreground">Staff Dashboard</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1" role="list">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                    tab === item.id
                      ? "bg-primary/10 text-primary glow-teal-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${
                        tab === item.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer - Quick Verify */}
        <div className="border-t border-border p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Quick Verify</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerify()
              }}
              placeholder="SRM-XXXXXX"
              className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 font-mono text-xs text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleVerify}
              disabled={searchLoading || !searchId.trim()}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
            >
              {searchLoading ? "..." : "Go"}
            </button>
          </div>
          {searchResult && (
            <div
              className={`mt-2 rounded-lg p-2 text-xs ${
                searchResult.success
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {searchResult.message}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:text-foreground lg:hidden"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {tab === "overview" && "Dashboard Overview"}
                {tab === "active" && "Active Orders"}
                {tab === "prebooked" && "Pre-booked Orders"}
                {tab === "delivered" && "Delivered Orders"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {tab === "overview" && "Real-time canteen operations at a glance"}
                {tab === "active" && "Orders currently being prepared"}
                {tab === "prebooked" && "Upcoming scheduled pickup orders"}
                {tab === "delivered" && "Completed order history"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-all hover:text-foreground ${
                refreshing ? "animate-spin" : ""
              }`}
              aria-label="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <div className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Live</span>
            </div>
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                tab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.icon}
              {item.label}
              {item.count !== undefined && item.count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-bold text-primary">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 lg:px-8">
          {/* Overview Tab */}
          {tab === "overview" && stats && orders && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  icon={<Flame className="h-5 w-5" />}
                  label="Active Queue"
                  value={stats.activeInstantOrders}
                  sub={`of ${stats.maxInstantOrders} capacity`}
                  color="amber"
                  percentage={Math.round(
                    (stats.activeInstantOrders / stats.maxInstantOrders) * 100
                  )}
                />
                <StatCard
                  icon={<CalendarClock className="h-5 w-5" />}
                  label="Pre-booked"
                  value={stats.activePrebooked}
                  sub="upcoming orders"
                  color="blue"
                />
                <StatCard
                  icon={<PackageCheck className="h-5 w-5" />}
                  label="Delivered Today"
                  value={stats.totalDelivered}
                  sub={`out of ${stats.totalOrders} total`}
                  color="emerald"
                />
                <StatCard
                  icon={<IndianRupee className="h-5 w-5" />}
                  label="Revenue"
                  value={stats.totalRevenue}
                  sub="from delivered orders"
                  color="teal"
                  prefix="Rs."
                />
              </div>

              {/* Queue Progress */}
              <div className="glass-card rounded-2xl p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Activity className="h-4 w-4 text-primary" />
                    Live Queue Capacity
                  </h3>
                  <span className="text-sm font-mono text-muted-foreground">
                    {stats.activeInstantOrders}/{stats.maxInstantOrders}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      stats.activeInstantOrders / stats.maxInstantOrders > 0.8
                        ? "bg-destructive"
                        : stats.activeInstantOrders / stats.maxInstantOrders > 0.5
                          ? "bg-amber-500"
                          : "bg-primary"
                    }`}
                    style={{
                      width: `${(stats.activeInstantOrders / stats.maxInstantOrders) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {stats.activeInstantOrders >= stats.maxInstantOrders
                    ? "Queue is full - new instant orders are blocked"
                    : `${stats.maxInstantOrders - stats.activeInstantOrders} slots remaining`}
                </p>
              </div>

              {/* Recent Orders Section */}
              <div className="grid gap-6 xl:grid-cols-2">
                {/* Active Instant Orders */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Flame className="h-4 w-4 text-amber-400" />
                      Active Instant Orders
                    </h3>
                    {orders.active.length > 0 && (
                      <button
                        onClick={() => setTab("active")}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View All <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {orders.active.length === 0 ? (
                    <EmptyState message="No active instant orders" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {orders.active.slice(0, 5).map((order) => (
                        <OrderRow
                          key={order.id}
                          order={order}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Pre-booked Orders */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <CalendarClock className="h-4 w-4 text-blue-400" />
                      Pre-booked Orders
                    </h3>
                    {orders.prebooked.length > 0 && (
                      <button
                        onClick={() => setTab("prebooked")}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        View All <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {orders.prebooked.length === 0 ? (
                    <EmptyState message="No pre-booked orders" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      {orders.prebooked.slice(0, 5).map((order) => (
                        <OrderRow
                          key={order.id}
                          order={order}
                          onStatusUpdate={handleStatusUpdate}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Verify Section (mobile) */}
              <div className="glass-card rounded-2xl p-6 lg:hidden">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Search className="h-4 w-4 text-primary" />
                  Quick Verify Order
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVerify()
                    }}
                    placeholder="Enter Order ID"
                    className="flex-1 rounded-xl border border-border bg-secondary/50 px-4 py-3 font-mono text-sm text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={searchLoading || !searchId.trim()}
                    className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    {searchLoading ? "..." : "Verify"}
                  </button>
                </div>
                {searchResult && (
                  <div
                    className={`mt-3 rounded-xl p-3 text-sm ${
                      searchResult.success
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {searchResult.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Orders Tab */}
          {tab === "active" && (
            <div className="animate-in fade-in duration-500">
              {orders && orders.active.length === 0 ? (
                <EmptyStateLarge
                  icon={<ClipboardList className="h-10 w-10 text-muted-foreground" />}
                  title="No Active Orders"
                  description="When students place instant orders, they will appear here for preparation tracking."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {orders?.active.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pre-booked Tab */}
          {tab === "prebooked" && (
            <div className="animate-in fade-in duration-500">
              {orders && orders.prebooked.length === 0 ? (
                <EmptyStateLarge
                  icon={<BookmarkCheck className="h-10 w-10 text-muted-foreground" />}
                  title="No Pre-booked Orders"
                  description="Pre-booked orders with scheduled time slots will appear here."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {orders?.prebooked.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Delivered Tab */}
          {tab === "delivered" && (
            <div className="animate-in fade-in duration-500">
              {orders && orders.delivered.length === 0 ? (
                <EmptyStateLarge
                  icon={<Truck className="h-10 w-10 text-muted-foreground" />}
                  title="No Delivered Orders Yet"
                  description="Completed orders will be listed here as a log."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {orders?.delivered.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {!data && (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ---------- Sub-components ---------- */

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  percentage,
  prefix,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  color: "teal" | "blue" | "amber" | "emerald" | "rose"
  percentage?: number
  prefix?: string
}) {
  const colorMap = {
    teal: {
      iconBg: "bg-primary/10",
      iconText: "text-primary",
      glow: "glow-teal-sm",
    },
    blue: {
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-400",
      glow: "glow-blue",
    },
    amber: {
      iconBg: "bg-amber-500/10",
      iconText: "text-amber-400",
      glow: "glow-amber",
    },
    emerald: {
      iconBg: "bg-emerald-500/10",
      iconText: "text-emerald-400",
      glow: "glow-emerald",
    },
    rose: {
      iconBg: "bg-rose-500/10",
      iconText: "text-rose-400",
      glow: "glow-rose",
    },
  }

  const c = colorMap[color]

  return (
    <div className={`glass-card rounded-2xl p-5 transition-all hover:${c.glow}`}>
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBg}`}>
          <span className={c.iconText}>{icon}</span>
        </div>
        {percentage !== undefined && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            {percentage}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">
        {prefix}
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground/70">{sub}</p>
    </div>
  )
}

function OrderRow({
  order,
  onStatusUpdate,
}: {
  order: Order
  onStatusUpdate: (id: string, status: OrderStatus) => void
}) {
  const config = STATUS_CONFIG[order.status]
  const timeAgo = getTimeAgo(order.createdAt)

  return (
    <div className="flex items-center gap-4 rounded-xl bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-primary">{order.id}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
            {config.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-foreground">
          <span className="font-medium">{order.studentName}</span>
          <span className="text-muted-foreground">{" - "}</span>
          <span>{formatItemsShort(order)}</span>
        </p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      {config.next && (
        <button
          onClick={() => onStatusUpdate(order.id, config.next!)}
          className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
        >
          {config.nextLabel}
        </button>
      )}
    </div>
  )
}

function OrderCard({
  order,
  onStatusUpdate,
}: {
  order: Order
  onStatusUpdate: (id: string, status: OrderStatus) => void
}) {
  const config = STATUS_CONFIG[order.status]
  const timeAgo = getTimeAgo(order.createdAt)
  const slotLabel =
    order.timeSlot && TIME_SLOTS.find((s) => s.id === order.timeSlot)?.label

  return (
    <div className="glass-card rounded-2xl p-5 transition-all hover:glow-teal-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left side */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-lg font-bold text-foreground">
            {order.items && order.items.length > 0 ? order.items[0].emoji : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-primary">
                {order.id}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
              >
                {config.label}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  order.orderType === "INSTANT"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {order.orderType === "INSTANT" ? "Instant" : "Pre-book"}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground">
              <span className="font-medium">{order.studentName}</span>
            </p>

            {/* Items breakdown */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {order.items && order.items.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-lg bg-secondary/50 px-2 py-1 text-xs text-foreground"
                >
                  <span className="font-semibold text-primary">{item.emoji}</span>
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="font-medium text-muted-foreground">x{item.quantity}</span>
                  )}
                  <span className="text-muted-foreground">Rs.{item.price * item.quantity}</span>
                </span>
              ))}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
              {order.orderType === "INSTANT" && order.queuePosition && (
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" />
                  Queue #{order.queuePosition}
                </span>
              )}
              {order.orderType === "INSTANT" && order.estimatedReadyTime && (
                <span className="flex items-center gap-1 text-primary">
                  <Clock className="h-3 w-3" />
                  ETA: {order.estimatedReadyTime}
                </span>
              )}
              {slotLabel && (
                <span className="flex items-center gap-1 text-blue-400">
                  <CalendarClock className="h-3 w-3" />
                  {slotLabel}
                </span>
              )}
              <span className="flex items-center gap-1 font-semibold text-primary">
                <IndianRupee className="h-3 w-3" />
                Rs.{order.totalPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Action */}
        {config.next && (
          <button
            onClick={() => onStatusUpdate(order.id, config.next!)}
            className="flex shrink-0 items-center gap-2 self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 sm:self-center"
          >
            <CheckCircle2 className="h-4 w-4" />
            {config.nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-6 w-6 text-muted-foreground/50" />
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function EmptyStateLarge({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary/50">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function getTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ago`
}
