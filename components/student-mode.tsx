"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { MENU_ITEMS, TIME_SLOTS, type Order, type OrderType, type CartItem } from "@/lib/store"
import { QRCode, downloadQR } from "@/components/qr-code"
import {
  Clock,
  ShoppingBag,
  Zap,
  CalendarClock,
  CheckCircle2,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Download,
  ShoppingCart,
} from "lucide-react"

type Step = "menu" | "options" | "confirm" | "success"

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string; iconBg: string }> = {
  Snacks: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/30", iconBg: "bg-amber-500/15" },
  Beverages: { bg: "bg-blue-500/10", text: "text-blue-400", ring: "ring-blue-500/30", iconBg: "bg-blue-500/15" },
  Meals: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/30", iconBg: "bg-emerald-500/15" },
}

export function StudentMode({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>("menu")
  const [studentName, setStudentName] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<OrderType>("INSTANT")
  const [selectedSlot, setSelectedSlot] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [countdown, setCountdown] = useState(15)
  const qrRef = useRef<HTMLCanvasElement>(null)

  // 15-second auto-redirect after order success
  const handleAutoRedirect = useCallback(() => {
    resetOrder()
    onBack()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (step !== "success") {
      setCountdown(15)
      return
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoRedirect()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [step, handleAutoRedirect])

  const categories = useMemo(() => {
    const cats = Array.from(new Set(MENU_ITEMS.map((i) => i.category)))
    return ["All", ...cats]
  }, [])

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return MENU_ITEMS
    return MENU_ITEMS.filter((i) => i.category === activeCategory)
  }, [activeCategory])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  function addToCart(menuItem: (typeof MENU_ITEMS)[0]) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === menuItem.id)
      if (existing) {
        return prev.map((c) =>
          c.id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [
        ...prev,
        {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          emoji: menuItem.emoji,
          category: menuItem.category,
        },
      ]
    })
  }

  function updateQuantity(itemId: string, delta: number) {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.id === itemId) {
            const newQty = c.quantity + delta
            return newQty <= 0 ? null : { ...c, quantity: newQty }
          }
          return c
        })
        .filter(Boolean) as CartItem[]
    })
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((c) => c.id !== itemId))
  }

  function getCartQty(itemId: string): number {
    return cart.find((c) => c.id === itemId)?.quantity || 0
  }

  async function placeOrder() {
    if (!studentName.trim()) {
      setError("Please enter your name.")
      return
    }
    if (cart.length === 0) {
      setError("Please add items to your cart.")
      return
    }
    if (orderType === "PREBOOK" && !selectedSlot) {
      setError("Please select a time slot.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          items: cart,
          orderType,
          timeSlot: selectedSlot || undefined,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || "Failed to place order.")
        setLoading(false)
        return
      }

      setOrder(data.order)
      setStep("success")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleDownloadQR() {
    if (!order) return
    // Find the canvas inside the QR section
    const canvas = document.querySelector('canvas[aria-label^="QR Code"]') as HTMLCanvasElement | null
    downloadQR(canvas, order.id)
  }

  function resetOrder() {
    setStep("menu")
    setStudentName("")
    setCart([])
    setOrderType("INSTANT")
    setSelectedSlot("")
    setOrder(null)
    setError("")
    setActiveCategory("All")
  }

  const steps = ["menu", "options", "confirm", "success"] as const
  const currentStepIndex = steps.indexOf(step)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Fixed App Bar */}
      <header className="sticky top-0 z-20 glass-strong px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            onClick={step === "menu" ? onBack : step === "success" ? resetOrder : () => setStep(steps[currentStepIndex - 1])}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-foreground">
              {step === "menu" && "Order Food"}
              {step === "options" && "Order Type"}
              {step === "confirm" && "Review Order"}
              {step === "success" && "Order Confirmed"}
            </h1>
          </div>
          {/* Step Indicator */}
          {step !== "success" && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i <= currentStepIndex
                      ? "w-5 bg-primary"
                      : "w-1.5 bg-secondary"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 pb-28">
        <div className="mx-auto max-w-lg">
          {/* Step: Menu Selection */}
          {step === "menu" && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Name Input */}
              <div className="glass-card rounded-2xl p-5">
                <label
                  htmlFor="studentName"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Your Name
                </label>
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3.5 text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground glow-teal-sm"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu Items */}
              <div className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  Menu
                  <span className="text-xs text-muted-foreground">
                    ({filteredItems.length} items)
                  </span>
                </h2>
                {filteredItems.map((item) => {
                  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Snacks
                  const qty = getCartQty(item.id)
                  const inCart = qty > 0
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 transition-all duration-300 ${
                        inCart
                          ? `glass-strong ring-1 ${catColor.ring} glow-teal-sm`
                          : "glass-card"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-bold transition-colors ${
                            inCart
                              ? "bg-primary text-primary-foreground"
                              : `${catColor.iconBg} ${catColor.text}`
                          }`}
                        >
                          {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">
                              {item.name}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${catColor.bg} ${catColor.text}`}
                            >
                              {item.category}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-base font-bold text-primary">
                            {"Rs."}{item.price}
                          </span>
                          {/* Quantity Controls */}
                          {inCart ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                                aria-label={`Decrease ${item.name} quantity`}
                              >
                                {qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                              </button>
                              <span className="flex h-8 w-8 items-center justify-center text-sm font-bold text-foreground">
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary transition-colors hover:bg-primary/25"
                                aria-label={`Increase ${item.name} quantity`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="flex h-8 items-center gap-1 rounded-lg bg-primary/15 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/25"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Cart Summary (if items in cart) */}
              {cart.length > 0 && (
                <div className="glass-card glow-teal-sm rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Your Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-xl bg-secondary/30 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{item.emoji}</span>
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">Rs.{item.price * item.quantity}</span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Order Options */}
          {step === "options" && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Cart preview */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{cartCount} {cartCount === 1 ? "item" : "items"} for {studentName}</p>
                    <p className="text-xs text-muted-foreground">{cart.map(c => `${c.name} x${c.quantity}`).join(", ")}</p>
                  </div>
                  <span className="text-base font-bold text-primary">Rs.{cartTotal}</span>
                </div>
              </div>

              {/* Order Type */}
              <div className="flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Choose Order Type
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setOrderType("INSTANT")
                      setSelectedSlot("")
                    }}
                    className={`flex flex-col items-center gap-3 rounded-2xl p-5 transition-all duration-300 ${
                      orderType === "INSTANT"
                        ? "glass-strong glow-amber ring-1 ring-amber-500/30"
                        : "glass-card hover:glow-teal-sm"
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      orderType === "INSTANT" ? "bg-amber-500/15" : "bg-secondary"
                    }`}>
                      <Zap
                        className={`h-6 w-6 ${
                          orderType === "INSTANT"
                            ? "text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <span className="block font-semibold text-foreground">Instant</span>
                      <span className="text-xs text-muted-foreground">
                        Join live queue
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setOrderType("PREBOOK")}
                    className={`flex flex-col items-center gap-3 rounded-2xl p-5 transition-all duration-300 ${
                      orderType === "PREBOOK"
                        ? "glass-strong glow-blue ring-1 ring-blue-500/30"
                        : "glass-card hover:glow-teal-sm"
                    }`}
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      orderType === "PREBOOK" ? "bg-blue-500/15" : "bg-secondary"
                    }`}>
                      <CalendarClock
                        className={`h-6 w-6 ${
                          orderType === "PREBOOK"
                            ? "text-blue-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <span className="block font-semibold text-foreground">
                        Pre-book
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Pick a time slot
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Time Slots (for PREBOOK) */}
              {orderType === "PREBOOK" && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Clock className="h-4 w-4 text-blue-400" />
                    Select Time Slot
                  </h2>
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`w-full rounded-2xl p-4 text-left transition-all duration-300 ${
                        selectedSlot === slot.id
                          ? "glass-strong glow-blue ring-1 ring-blue-500/30"
                          : "glass-card hover:glow-teal-sm"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          selectedSlot === slot.id
                            ? "text-blue-400"
                            : "text-foreground"
                        }`}
                      >
                        {slot.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Confirm Order */}
          {step === "confirm" && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="glass-card rounded-2xl p-6">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Order Summary
                </h2>
                <div className="flex flex-col gap-3">
                  <SummaryRow label="Name" value={studentName} />
                  <div className="my-1 border-t border-border" />

                  {/* Items List */}
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items</p>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-secondary/30 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{item.emoji}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Rs.{item.price} x {item.quantity}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-foreground">Rs.{item.price * item.quantity}</span>
                    </div>
                  ))}

                  <div className="my-1 border-t border-border" />
                  <SummaryRow
                    label="Type"
                    value={orderType === "INSTANT" ? "Instant Order" : "Pre-booked"}
                  />
                  {orderType === "PREBOOK" && selectedSlot && (
                    <SummaryRow
                      label="Time Slot"
                      value={TIME_SLOTS.find((s) => s.id === selectedSlot)?.label || ""}
                    />
                  )}
                  <div className="my-2 border-t border-border" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      Rs.{cartTotal}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && order && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 glow-emerald">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="mb-1 text-xl font-bold text-foreground">
                  Order Confirmed!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Payment successful. Show the QR code at the counter.
                </p>

                {/* Countdown Timer */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="relative h-12 w-12">
                    <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-secondary"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - countdown / 15)}`}
                        strokeLinecap="round"
                        className="text-primary transition-all duration-1000 ease-linear"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                      {countdown}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Redirecting to home in {countdown}s
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="glass-card glow-teal rounded-2xl p-8">
                <div className="flex flex-col items-center gap-4">
                  <QRCode value={order.id} size={220} orderId={order.id} />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="text-2xl font-bold tracking-wider font-mono text-primary">
                      {order.id}
                    </p>
                  </div>
                  {/* Download Button */}
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 glow-teal-sm"
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </button>
                </div>
              </div>

              {/* Order Details */}
              <div className="glass-card rounded-2xl p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Details</h3>
                <div className="flex flex-col gap-2 mb-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{item.emoji}</span>
                        <span className="text-sm text-foreground">{item.name} x{item.quantity}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Rs.{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">Rs.{order.totalPrice}</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <SummaryRow
                      label="Type"
                      value={
                        order.orderType === "INSTANT"
                          ? "Instant Order"
                          : "Pre-booked"
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
                      {order.status}
                    </span>
                  </div>
                  {order.orderType === "INSTANT" && order.estimatedReadyTime && (
                    <>
                      <SummaryRow
                        label="Queue Position"
                        value={`#${order.queuePosition}`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Estimated Ready
                        </span>
                        <span className="font-bold text-primary">
                          {order.estimatedReadyTime}
                        </span>
                      </div>
                    </>
                  )}
                  {order.orderType === "PREBOOK" && order.timeSlot && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Pickup Slot</span>
                      <span className="font-bold text-blue-400">
                        {TIME_SLOTS.find((s) => s.id === order.timeSlot)?.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      {step !== "success" && (
        <div className="sticky bottom-0 z-20 glass-strong px-4 py-4">
          <div className="mx-auto max-w-lg">
            {step === "menu" && (
              <button
                onClick={() => {
                  if (!studentName.trim()) {
                    setError("Please enter your name.")
                    return
                  }
                  if (cart.length === 0) {
                    setError("Please add items to your cart.")
                    return
                  }
                  setError("")
                  setStep("options")
                }}
                disabled={!studentName.trim() || cart.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-center font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 glow-teal"
              >
                <ShoppingBag className="h-5 w-5" />
                Continue
                {cartCount > 0 && (
                  <span className="rounded-full bg-primary-foreground/20 px-2.5 py-0.5 text-xs">
                    {cartCount} {cartCount === 1 ? "item" : "items"} - Rs.{cartTotal}
                  </span>
                )}
              </button>
            )}
            {step === "options" && (
              <button
                onClick={() => {
                  if (orderType === "PREBOOK" && !selectedSlot) {
                    setError("Please select a time slot.")
                    return
                  }
                  setError("")
                  setStep("confirm")
                }}
                className="w-full rounded-2xl bg-primary py-4 text-center font-semibold text-primary-foreground transition-all hover:opacity-90 glow-teal"
              >
                Review Order
              </button>
            )}
            {step === "confirm" && (
              <button
                onClick={placeOrder}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 glow-teal"
              >
                <ShoppingBag className="h-5 w-5" />
                {loading ? "Processing Payment..." : `Pay Rs.${cartTotal} & Place Order`}
              </button>
            )}
            {error && (
              <p className="mt-2 text-center text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
      )}

      {/* Success bottom bar */}
      {step === "success" && (
        <div className="sticky bottom-0 z-20 glass-strong px-4 py-4">
          <div className="mx-auto flex max-w-lg gap-3">
            <button
              onClick={handleDownloadQR}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-primary/30 py-4 font-semibold text-primary transition-all hover:bg-primary/10"
            >
              <Download className="h-5 w-5" />
              Save QR
            </button>
            <button
              onClick={() => {
                resetOrder()
                onBack()
              }}
              className="flex-1 rounded-2xl bg-primary py-4 text-center font-semibold text-primary-foreground transition-all hover:opacity-90 glow-teal"
            >
              Home ({countdown}s)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
