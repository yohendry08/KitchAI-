"use client"

import { useState } from "react"
import { eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isSameMonth, isSameYear, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import type { ReservationRecord } from "@/lib/api"

interface ReservationCalendarProps {
  reservations: ReservationRecord[]
  onSelectDate: (date: Date) => void
}

export function ReservationCalendar({ reservations, onSelectDate }: ReservationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOffset = getDay(monthStart)
  const emptyCells = Array(firstDayOffset).fill(null)

  const getReservationsForDate = (date: Date) => {
    return reservations.filter(
      (res) => res.date.split("T")[0] === format(date, "yyyy-MM-dd")
    )
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Calendario de Reservas</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousMonth}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-32 text-center text-sm font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={nextMonth}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
          <div key={day} className="bg-background/50 rounded p-2 text-center text-xs font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells */}
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="rounded bg-background/20 p-2 min-h-[100px]" />
        ))}

        {/* Days */}
        {daysInMonth.map((date) => {
          const dayReservations = getReservationsForDate(date)
          const isToday = isSameDay(date, new Date())

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`rounded p-2 min-h-[100px] border-2 transition-colors hover:bg-primary/5 cursor-pointer flex flex-col ${
                isToday
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background/50"
              }`}
            >
              <div className={`text-xs font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                {format(date, "d")}
              </div>
              <div className="mt-1 flex-1 space-y-1 text-left w-full">
                {dayReservations.length > 0 && (
                  <>
                    {dayReservations.slice(0, 2).map((res) => (
                      <div
                        key={res.id}
                        className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-900 truncate hover:bg-amber-200"
                        title={`${res.name} - ${res.hour}`}
                      >
                        {res.hour}
                      </div>
                    ))}
                    {dayReservations.length > 2 && (
                      <div className="text-[10px] font-medium text-primary px-1">
                        +{dayReservations.length - 2} más
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
          <span>Tiene reservas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border-2 border-primary" />
          <span>Hoy</span>
        </div>
      </div>
    </div>
  )
}
