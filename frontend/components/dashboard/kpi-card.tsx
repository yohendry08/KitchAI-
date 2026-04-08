"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  className?: string
  trend?: "up" | "down" | "neutral"
  color?: "green" | "blue" | "orange" | "default"
}

// Mini sparkline SVG component
function Sparkline({ color = "default", trend = "up" }: { color?: string; trend?: "up" | "down" | "neutral" }) {
  const colors = {
    green: "#22c55e",
    blue: "#3b82f6",
    orange: "#f59e0b",
    default: "#c9a962",
  }
  const strokeColor = colors[color as keyof typeof colors] || colors.default

  // Different paths for different trends
  const paths = {
    up: "M0,20 Q10,18 20,15 T40,12 T60,8 T80,10 T100,5",
    down: "M0,5 Q10,8 20,10 T40,12 T60,15 T80,14 T100,18",
    neutral: "M0,12 Q10,10 20,14 T40,11 T60,13 T80,10 T100,12",
  }

  return (
    <svg viewBox="0 0 100 25" className="h-8 w-full" preserveAspectRatio="none">
      <path
        d={paths[trend]}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
  trend = "up",
  color = "default",
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>

      {/* Sparkline */}
      <div className="mt-3">
        <Sparkline color={color} trend={trend} />
      </div>
    </div>
  )
}
