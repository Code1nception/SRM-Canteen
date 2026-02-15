"use client"

import { useState } from "react"
import { StudentMode } from "@/components/student-mode"
import { StaffMode } from "@/components/staff-mode"
import {
  GraduationCap,
  ChefHat,
  Clock,
  Zap,
  QrCode,
  ShieldCheck,
  Smartphone,
  Monitor,
} from "lucide-react"

type AppMode = "landing" | "student" | "staff"

export default function Home() {
  const [mode, setMode] = useState<AppMode>("landing")

  if (mode === "student") {
    return <StudentMode onBack={() => setMode("landing")} />
  }

  if (mode === "staff") {
    return <StaffMode onBack={() => setMode("landing")} />
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo & Title */}
        <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 glow-teal">
            <span className="text-3xl font-black text-primary">SC</span>
          </div>
          <h1 className="text-balance text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            SRMCAN
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Smart College Canteen Booking
          </p>
          <p className="mt-1 text-pretty text-sm text-muted-foreground/80">
            Skip the crowd. Pre-book or order food instantly with QR verification.
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-150">
          {/* Student Card */}
          <button
            onClick={() => setMode("student")}
            className="group glass-card rounded-2xl p-6 text-left transition-all duration-300 hover:glow-teal-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                <Smartphone className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium text-primary">Mobile App</span>
              </div>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Student Mode
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse menu, pick items, choose instant or pre-book, pay and receive your QR code for pickup.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <FeatureChip icon={<UtensilsCrossed className="h-3 w-3" />} label="Menu" />
              <FeatureChip icon={<ShoppingBag className="h-3 w-3" />} label="Order" />
              <FeatureChip icon={<QrCode className="h-3 w-3" />} label="QR Code" />
            </div>
          </button>

          {/* Staff Card */}
          <button
            onClick={() => setMode("staff")}
            className="group glass-card rounded-2xl p-6 text-left transition-all duration-300 hover:glow-blue"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                <ChefHat className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1">
                <Monitor className="h-3 w-3 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">Web Dashboard</span>
              </div>
            </div>
            <h2 className="text-lg font-bold text-foreground">
              Staff Mode
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Full dashboard with live order tracking, status management, pre-booked order view, and quick QR verification.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <FeatureChip icon={<Activity className="h-3 w-3" />} label="Live Orders" />
              <FeatureChip icon={<Clock className="h-3 w-3" />} label="Pre-booked" />
              <FeatureChip icon={<ShieldCheck className="h-3 w-3" />} label="Verify" />
            </div>
          </button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-both delay-300">
          <FeatureCard
            icon={<Zap className="h-5 w-5 text-amber-400" />}
            title="Instant Orders"
            description="Live queue system"
            glowClass="hover:glow-amber"
          />
          <FeatureCard
            icon={<Clock className="h-5 w-5 text-blue-400" />}
            title="Pre-booking"
            description="Choose your slot"
            glowClass="hover:glow-blue"
          />
          <FeatureCard
            icon={<QrCode className="h-5 w-5 text-primary" />}
            title="QR Verification"
            description="Quick pickup"
            glowClass="hover:glow-teal-sm"
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
            title="Smart Limits"
            description="No overcrowding"
            glowClass="hover:glow-emerald"
          />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground/60 animate-in fade-in duration-700 fill-mode-both delay-500">
          Built for SRM University Canteen
        </p>
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  glowClass,
}: {
  icon: React.ReactNode
  title: string
  description: string
  glowClass: string
}) {
  return (
    <div className={`glass-card rounded-xl p-4 text-center transition-all duration-300 ${glowClass}`}>
      <div className="mx-auto mb-2">{icon}</div>
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function FeatureChip({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
      {icon}
      {label}
    </span>
  )
}

// Re-export icons used inline
function UtensilsCrossed(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
      <path d="m2.1 21.8 6.4-6.3" />
      <path d="m19 5-7 7" />
    </svg>
  )
}

function ShoppingBag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function Activity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  )
}
