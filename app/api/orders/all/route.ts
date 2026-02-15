import { NextResponse } from "next/server"
import { getAllOrders, getStats } from "@/lib/store"

export async function GET() {
  const orders = getAllOrders()
  const stats = getStats()
  console.log("[v0] All orders fetch:", { active: orders.active.length, prebooked: orders.prebooked.length, delivered: orders.delivered.length, total: orders.all.length })
  return NextResponse.json({ orders, stats })
}
