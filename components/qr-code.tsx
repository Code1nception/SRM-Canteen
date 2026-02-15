"use client"

import { useEffect, useRef, useCallback } from "react"

interface QRCodeProps {
  value: string
  size?: number
  orderId?: string
}

export function QRCode({ value, size = 200, orderId }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const drawQR = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const moduleCount = 21
    const cellSize = size / moduleCount

    canvas.width = size
    canvas.height = size

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, size, size)

    const hash = simpleHash(value)
    const bits = generateBits(hash, moduleCount)

    ctx.fillStyle = "#0f172a"

    drawFinderPattern(ctx, 0, 0, cellSize)
    drawFinderPattern(ctx, (moduleCount - 7) * cellSize, 0, cellSize)
    drawFinderPattern(ctx, 0, (moduleCount - 7) * cellSize, cellSize)

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (isFinderArea(row, col, moduleCount)) continue
        if (bits[row * moduleCount + col]) {
          ctx.fillStyle = "#0f172a"
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }

    ctx.fillStyle = "#0f172a"
    ctx.font = `bold ${Math.max(10, size / 16)}px monospace`
    ctx.textAlign = "center"
    ctx.fillText(value, size / 2, size - 4)
  }, [value, size])

  useEffect(() => {
    drawQR()
  }, [drawQR])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded-lg"
      aria-label={`QR Code for order ${orderId || value}`}
    />
  )
}

export function downloadQR(canvasElement: HTMLCanvasElement | null, orderId: string) {
  if (!canvasElement) return

  // Create a new canvas with padding and branding for the download
  const padding = 40
  const brandHeight = 80
  const downloadCanvas = document.createElement("canvas")
  downloadCanvas.width = canvasElement.width + padding * 2
  downloadCanvas.height = canvasElement.height + padding * 2 + brandHeight

  const ctx = downloadCanvas.getContext("2d")
  if (!ctx) return

  // Background
  ctx.fillStyle = "#0d1117"
  ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height)

  // Rounded white background behind QR
  const qrBgX = padding - 10
  const qrBgY = padding - 10
  const qrBgW = canvasElement.width + 20
  const qrBgH = canvasElement.height + 20
  ctx.fillStyle = "#ffffff"
  roundRect(ctx, qrBgX, qrBgY, qrBgW, qrBgH, 12)
  ctx.fill()

  // Draw the QR code
  ctx.drawImage(canvasElement, padding, padding)

  // Brand text below QR
  const textY = padding + canvasElement.height + 30

  ctx.fillStyle = "#2dd4bf"
  ctx.font = "bold 18px sans-serif"
  ctx.textAlign = "center"
  ctx.fillText("SRMCAN", downloadCanvas.width / 2, textY + 10)

  ctx.fillStyle = "#94a3b8"
  ctx.font = "12px sans-serif"
  ctx.fillText(`Order: ${orderId}`, downloadCanvas.width / 2, textY + 32)

  ctx.fillStyle = "#64748b"
  ctx.font = "10px sans-serif"
  ctx.fillText("Show this QR at the canteen counter", downloadCanvas.width / 2, textY + 52)

  // Trigger download
  const link = document.createElement("a")
  link.download = `SRMCAN-${orderId}.png`
  link.href = downloadCanvas.toDataURL("image/png")
  link.click()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return Math.abs(hash)
}

function generateBits(seed: number, moduleCount: number): boolean[] {
  const total = moduleCount * moduleCount
  const bits: boolean[] = []
  let current = seed

  for (let i = 0; i < total; i++) {
    current = (current * 1103515245 + 12345) & 0x7fffffff
    bits.push(current % 3 === 0)
  }

  return bits
}

function isFinderArea(row: number, col: number, moduleCount: number): boolean {
  if (row < 8 && col < 8) return true
  if (row < 8 && col >= moduleCount - 8) return true
  if (row >= moduleCount - 8 && col < 8) return true
  return false
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number
) {
  const s = cellSize

  ctx.fillStyle = "#0f172a"
  ctx.fillRect(x, y, s * 7, s * 7)

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(x + s, y + s, s * 5, s * 5)

  ctx.fillStyle = "#0f172a"
  ctx.fillRect(x + s * 2, y + s * 2, s * 3, s * 3)
}
