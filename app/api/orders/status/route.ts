import { NextRequest, NextResponse } from "next/server"
import { updateOrderStatus } from "@/lib/store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Order ID and status are required." },
        { status: 400 }
      )
    }

    const result = updateOrderStatus(orderId, status)

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    )
  }
}
