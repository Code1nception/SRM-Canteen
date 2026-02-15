import { NextRequest, NextResponse } from "next/server"
import { createOrder, getStats } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentName, items, orderType, timeSlot } = body

    if (!studentName || !items || !Array.isArray(items) || items.length === 0 || !orderType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      )
    }

    console.log("[v0] Creating order:", { studentName, itemCount: items.length, orderType, timeSlot })
    const result = createOrder(studentName, items, orderType, timeSlot)
    console.log("[v0] Order result:", { success: result.success, orderId: result.order?.id, error: result.error })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    )
  }
}

export async function GET() {
  const stats = getStats()
  return NextResponse.json(stats)
}
