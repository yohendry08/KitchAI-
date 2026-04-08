import { cn } from "@/lib/utils"

const variants: Record<string, string> = {
  Pendiente: "border-[#e9ddd2] bg-[#f1ebe5] text-[#6c6259]",
  "En Proceso": "border-[#d6b16a] bg-[#a8740b] text-white",
  Entregado: "border-[#8ab8ba]/30 bg-[#3d6a6a] text-white",
  Confirmada: "border-[#97c8b6]/40 bg-[#d7efe4] text-[#2d6253]",
  Cancelada: "border-[#efb7b1] bg-[#fbe0dc] text-[#b43125]",
  Servir: "border-[#e0c28b] bg-[#f5e1bb] text-[#8a5c07]",
  Normal: "border-[#afdadd] bg-[#bfe6e9] text-[#29575b]",
  Bajo: "border-[#f1c888] bg-[#ffe0b0] text-[#8c5a00]",
  "Crítico": "border-[#f5b2ad] bg-[#ffd3cf] text-[#bf2419]",
  Critico: "border-[#f5b2ad] bg-[#ffd3cf] text-[#bf2419]",
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        variants[status] || "border-[#e9ddd2] bg-[#f4eee8] text-[#73675d]",
        className
      )}
    >
      {status}
    </span>
  )
}
