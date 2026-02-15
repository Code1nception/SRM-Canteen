import { NextRequest, NextResponse } from "next/server"
import { getOrder } from "@/lib/store"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const order = getOrder(id)

  if (!order) {
    return NextResponse.json(
      { success: false, error: "Order not found." },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, order })
}
