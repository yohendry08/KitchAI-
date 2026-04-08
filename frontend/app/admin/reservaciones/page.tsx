"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Clock, Map, Phone, Users, ChevronDown, RefreshCcw } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ReservationCalendar } from "@/components/dashboard/reservation-calendar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ApiError, api, type ReservationRecord } from "@/lib/api"

const statusOptions = ["Todos", "Pendiente", "Confirmada", "Cancelada"]

export default function ReservacionesPage() {
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReservation, setSelectedReservation] = useState<ReservationRecord | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)

  const loadReservations = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getReservations()
      setReservations(data)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudieron cargar las reservaciones."
      setError(message)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReservations()
  }, [])

  const filteredReservations = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    let filtered = reservations.filter((reservation) => {
      const matchSearch =
        !needle ||
        reservation.name.toLowerCase().includes(needle) ||
        reservation.email.toLowerCase().includes(needle) ||
        reservation.phone?.toLowerCase().includes(needle) ||
        reservation.date.includes(needle)
      const matchStatus = statusFilter === "Todos" || reservation.status === statusFilter
      return matchSearch && matchStatus
    })

    // Filter by selected calendar date if any
    if (selectedCalendarDate) {
      const dateStr = selectedCalendarDate.toISOString().split("T")[0]
      filtered = filtered.filter(r => r.date.split("T")[0] === dateStr)
    }

    return filtered
  }, [reservations, statusFilter, searchQuery, selectedCalendarDate])

  const handleStatusChange = async (reservationId: string, newStatus: "Pendiente" | "Confirmada" | "Cancelada") => {
    setUpdatingId(reservationId)
    try {
      await api.updateReservationStatus(reservationId, newStatus)
      setReservations(prev =>
        prev.map(r => r.id === reservationId ? { ...r, status: newStatus } : r)
      )
      setSelectedReservation(null)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo actualizar el estado."
      setError(message)
    } finally {
      setUpdatingId(null)
    }
  }

  const groupedByDate = useMemo(() => {
    const grouped: { [key: string]: ReservationRecord[] } = {}
    filteredReservations.forEach(reservation => {
      const date = reservation.date.split("T")[0]
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(reservation)
    })
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredReservations])

  const getTimeTableOccupancy = useMemo(() => {
    const today = new Date().toISOString().split("T")[0]
    const todayReservations = reservations.filter(r => r.date.split("T")[0] === today)
    const hours: { [key: string]: number } = {}
    todayReservations.forEach(r => {
      const hour = r.hour.split(":")[0]
      hours[hour] = (hours[hour] || 0) + 1
    })
    return hours
  }, [reservations])

  return (
    <DashboardLayout
      role="admin"
      userName="Alexander Ross"
      userRole="Chef Ejecutivo"
      title="Reservaciones"
      searchPlaceholder="Buscar por nombre, email, teléfono o fecha..."
    >
      <div className="space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#21150f] md:text-5xl">Gestión de Reservaciones</h1>
            <p className="mt-2 text-base text-[#74685d]">Visualiza, filtra y gestiona todas las reservaciones.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => void loadReservations()} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </Button>
        </section>

        {loading && <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando reservaciones...</div>}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="font-semibold text-destructive">Error al cargar las reservaciones.</p>
            <p className="mt-1 text-sm text-destructive/90">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => void loadReservations()}>
              Reintentar carga
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Calendario de reservaciones */}
            <ReservationCalendar
              reservations={reservations}
              onSelectDate={setSelectedCalendarDate}
            />

            {selectedCalendarDate && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Viendo reservaciones del {selectedCalendarDate.toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCalendarDate(null)}
                >
                  Limpiar filtro
                </Button>
              </div>
            )}

            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-2">
                <Input
                  placeholder="Buscar cliente, email, teléfono..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="min-w-0"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            {/* Ocupación de horarios hoy */}
            {Object.keys(getTimeTableOccupancy).length > 0 && (
              <section className="rounded-2xl border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-xl text-foreground">Ocupación de Horarios - Hoy</h2>
                </div>
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = String(i).padStart(2, "0")
                    const count = getTimeTableOccupancy[hour] || 0
                    return (
                      <div key={hour} className="rounded border border-border/50 bg-background/50 p-2 text-center">
                        <div className="text-xs font-medium text-muted-foreground">{hour}:00</div>
                        <div className={`mt-1 text-sm font-bold ${count > 0 ? "text-orange-600" : "text-green-600"}`}>
                          {count || "-"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Reservaciones por fecha */}
            <section className="space-y-6">
              {groupedByDate.length === 0 ? (
                <div className="rounded-xl border border-border/50 bg-background/50 p-12 text-center">
                  <p className="text-muted-foreground">No hay reservaciones que coincidan con los filtros.</p>
                </div>
              ) : (
                groupedByDate.map(([date, dateReservations]) => (
                  <div key={date} className="rounded-2xl border bg-card overflow-hidden">
                    <div className="border-b bg-background/50 px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">
                          {new Date(date).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {dateReservations.length} reserva{dateReservations.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1000px]">
                        <thead>
                          <tr className="border-b bg-background/30">
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                              Hora
                            </th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                              Cliente
                            </th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                              Contacto
                            </th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                              Personas
                            </th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dateReservations
                            .sort((a, b) => a.hour.localeCompare(b.hour))
                            .map((reservation) => (
                              <tr key={reservation.id} className="border-b last:border-0 hover:bg-background/50">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {reservation.hour}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm">{reservation.name}</td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                  <div className="space-y-1">
                                    <div>{reservation.email}</div>
                                    {reservation.phone && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {reservation.phone}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {reservation.guests}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <StatusBadge status={reservation.status} />
                                </td>
                                <td className="px-6 py-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedReservation(reservation)}
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {/* Dialog para cambiar status */}
        {selectedReservation && (
          <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Actualizar Reservación</DialogTitle>
                <DialogDescription>
                  Cambiar el estado de la reservación de {selectedReservation.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg bg-background/50 p-4 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Cliente:</span> {selectedReservation.name}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Fecha y Hora:</span> {selectedReservation.date} a las{" "}
                    {selectedReservation.hour}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Personas:</span> {selectedReservation.guests}
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Estado Actual:</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedReservation.status} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nuevo Estado</label>
                  <div className="space-y-2">
                    {(["Pendiente", "Confirmada", "Cancelada"] as const).map((status) => (
                      <Button
                        key={status}
                        variant={selectedReservation.status === status ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => void handleStatusChange(selectedReservation.id, status)}
                        disabled={updatingId === selectedReservation.id}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedReservation(null)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
