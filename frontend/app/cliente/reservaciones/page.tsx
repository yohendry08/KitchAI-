"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { CalendarDays, Clock3, Minus, Plus, Users } from "lucide-react"
import { ClientShell, useClientSession } from "@/components/client/client-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, api, type ReservationRecord } from "@/lib/api"

const ambienceOptions = [
  {
    id: "salon-principal",
    title: "Salon Principal",
    description: "Elegancia clasica y vista a la cocina.",
    image: "/images/reservation-ambience.jpg",
  },
  {
    id: "terraza",
    title: "La Terraza",
    description: "Luz calida y ambiente abierto para cenas largas.",
    image: "/images/hero-restaurant.jpg",
  },
  {
    id: "privado",
    title: "El Reservado",
    description: "Privacidad absoluta para celebraciones exclusivas.",
    image: "/images/restaurant-ambience.jpg",
  },
]

const timeSlots = ["13:30", "14:00", "14:30", "15:00", "20:30", "21:00", "21:30", "22:00"]

export default function ClienteReservacionesPage() {
  return (
    <ClientShell backHref="/cliente">
      <ClienteReservacionesContent />
    </ClientShell>
  )
}

function ClienteReservacionesContent() {
  const user = useClientSession()
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedAmbience, setSelectedAmbience] = useState(ambienceOptions[1].id)
  const [selectedTime, setSelectedTime] = useState("14:30")
  const [form, setForm] = useState({
    date: "",
    guests: 4,
    name: "",
    email: "",
    notes: "",
  })

  useEffect(() => {
    if (!user) return
    setForm((current) => ({
      ...current,
      name: current.name || `${user.firstName} ${user.lastName}`.trim(),
      email: current.email || user.email,
    }))
  }, [user])

  const loadReservations = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getReservations()
      setReservations(response)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudieron cargar tus reservaciones."
      setError(message)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReservations()
  }, [])

  const selectedAmbienceCard = useMemo(
    () => ambienceOptions.find((item) => item.id === selectedAmbience) || ambienceOptions[0],
    [selectedAmbience]
  )

  const submitReservation = async () => {
    if (!form.date || !selectedTime || !form.name || !form.email) {
      setError("Completa fecha, horario y datos de contacto para confirmar la reserva.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccessMessage("")

    try {
      await api.createReservation({
        date: form.date,
        hour: selectedTime,
        guests: form.guests,
        name: form.name,
        email: form.email,
      })

      setSuccessMessage("Reserva confirmada. Ya puedes verla en tu historial.")
      setForm((current) => ({ ...current, notes: "" }))
      await loadReservations()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo confirmar la reservacion."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <section className="space-y-8 lg:space-y-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-end">
        <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d7740]">Reserva tu experiencia</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight text-[#23160d] sm:text-6xl xl:text-7xl">
          Reserva tu
          <br />
          Experiencia
          <br />
          Culinaria
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#6a5a49]">
          Selecciona el ambiente, el horario y los invitados para que la cocina y sala preparen todo a tu ritmo.
        </p>
          <div className="mt-5 flex gap-2">
            <span className="rounded-2xl bg-[#ece6dd] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#806a50]">
              Michelin Guide 2024
            </span>
            <span className="rounded-2xl bg-[#d4ecf1] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#49717c]">
              Table Service
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[30px] bg-[#2b190f] shadow-[0_28px_65px_rgba(55,34,17,0.2)]">
          <div className="relative h-[300px] w-full xl:h-[360px]">
            <Image src="/images/reservation-ambience.jpg" alt="Salon de KitchAI" fill className="object-cover opacity-90" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,20,12,0.05)_0%,rgba(34,20,12,0.46)_100%)]" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <div className="space-y-6">
          <SectionNumber number="01" title="Seleccione Fecha y Comensales" />
          <div className="space-y-4 rounded-[28px] bg-white px-4 py-5 shadow-[0_20px_50px_rgba(80,53,24,0.06)] sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8d7a67]">Fecha de reserva</span>
              <div className="mt-3 flex items-center gap-3 rounded-[20px] border border-[#eadfce] bg-[#fffaf5] px-4 py-3">
                <CalendarDays className="h-4 w-4 text-[#9a6f17]" />
                <Input
                  type="date"
                  className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                  value={form.date}
                  onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                />
              </div>
            </label>

            <div>
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8d7a67]">Comensales</span>
              <div className="mt-3 flex items-center justify-between rounded-[20px] border border-[#eadfce] bg-[#fffaf5] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, guests: Math.max(1, current.guests - 1) }))}
                  className="rounded-full border border-[#eadfce] p-2 text-[#8b5a0b]"
                  aria-label="Restar comensales"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-[#9a6f17]" />
                  <span className="text-base font-medium text-[#21150d]">{form.guests} personas</span>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, guests: current.guests + 1 }))}
                  className="rounded-full border border-[#eadfce] p-2 text-[#8b5a0b]"
                  aria-label="Sumar comensales"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <SectionNumber number="02" title="Elija su Ambiente" />
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {ambienceOptions.map((ambience) => {
              const isActive = ambience.id === selectedAmbience

              return (
                <button
                  key={ambience.id}
                  type="button"
                  onClick={() => setSelectedAmbience(ambience.id)}
                  className={`relative block w-full overflow-hidden rounded-[26px] text-left shadow-[0_20px_50px_rgba(80,53,24,0.1)] ${
                    isActive ? "ring-2 ring-[#a47111]" : ""
                  }`}
                >
                  <div className="relative h-64 w-full">
                    <Image src={ambience.image} alt={ambience.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,12,8,0.05)_0%,rgba(20,12,8,0.62)_100%)]" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <h3 className="font-serif text-3xl">{ambience.title}</h3>
                    <p className="mt-2 text-sm text-white/85">{ambience.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          <SectionNumber number="03" title="Horario" />
          <div className="grid grid-cols-2 gap-3 rounded-[28px] bg-white p-4 shadow-[0_20px_50px_rgba(80,53,24,0.06)] sm:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4">
            {timeSlots.map((slot) => {
              const isActive = slot === selectedTime

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-2xl border px-2 py-3 text-sm transition ${
                    isActive
                      ? "border-[#8e630d] bg-[#9b6c0f] text-white shadow-[0_10px_20px_rgba(155,108,15,0.25)]"
                      : "border-[#eadfce] bg-[#fffaf5] text-[#7a6d5f]"
                  }`}
                >
                  {slot}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <div className="rounded-[28px] bg-white px-4 py-5 shadow-[0_20px_50px_rgba(80,53,24,0.06)]">
        <h2 className="font-serif text-3xl text-[#1f150d]">Resumen</h2>
        <div className="mt-5 space-y-4 text-sm text-[#4f3e31]">
          <SummaryRow icon={<CalendarDays className="h-4 w-4 text-[#9a6f17]" />} label="Fecha" value={formatDateLabel(form.date)} />
          <SummaryRow icon={<Users className="h-4 w-4 text-[#9a6f17]" />} label="Personas" value={`${form.guests} comensales`} />
          <SummaryRow icon={<Clock3 className="h-4 w-4 text-[#9a6f17]" />} label="Horario" value={selectedTime} />
          <SummaryRow icon={<CalendarDays className="h-4 w-4 text-[#9a6f17]" />} label="Ubicacion" value={selectedAmbienceCard.title} />
        </div>

        <div className="mt-5 space-y-3">
          <Input
            placeholder="Nombre completo"
            className="h-11 rounded-2xl border-[#eadfce] bg-[#fffaf5]"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <Input
            type="email"
            placeholder="Correo electronico"
            className="h-11 rounded-2xl border-[#eadfce] bg-[#fffaf5]"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
          <Textarea
            placeholder="Peticiones especiales"
            className="min-h-24 rounded-2xl border-[#eadfce] bg-[#fffaf5]"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </div>

        {error ? <p className="mt-4 text-sm text-[#a13c2a]">{error}</p> : null}
        {successMessage ? <p className="mt-4 text-sm text-[#2a7a52]">{successMessage}</p> : null}

        <Button
          className="mt-6 h-12 w-full rounded-2xl bg-[#8e630d] text-sm uppercase tracking-[0.22em] text-white hover:bg-[#7a560b]"
          onClick={() => void submitReservation()}
          disabled={submitting}
        >
          {submitting ? "Confirmando..." : "Confirmar reserva"}
        </Button>
          </div>

          <div className="rounded-[22px] border border-[#d8ebe8] bg-[#eff8f6] px-4 py-4 text-sm text-[#40605f]">
            Reserva protegida con confirmacion instantanea por email y acceso prioritario al concierge.
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-3xl text-[#23160d]">Tus reservaciones</h2>
          <button type="button" onClick={() => void loadReservations()} className="text-xs uppercase tracking-[0.22em] text-[#8e630d]">
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="rounded-[24px] border border-[#eadfce] bg-white px-4 py-4 text-sm text-[#786b5d]">
            Cargando reservaciones...
          </div>
        ) : null}

        {!loading && reservations.length === 0 ? (
          <div className="rounded-[24px] bg-white px-4 py-5 text-sm text-[#6f6052] shadow-[0_20px_50px_rgba(80,53,24,0.05)]">
            Aun no hay reservaciones registradas para tu cuenta.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {!loading &&
          reservations.map((reservation) => (
            <article
              key={reservation.id + reservation.createdAt}
              className="rounded-[24px] bg-white px-4 py-5 shadow-[0_20px_50px_rgba(80,53,24,0.05)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#aa8859]">{reservation.status}</p>
                  <h3 className="mt-2 font-serif text-2xl text-[#20140d]">{formatDateLabel(reservation.date)}</h3>
                  <p className="mt-2 text-sm text-[#6c5d4e]">
                    {reservation.hour} · {reservation.guests} personas
                  </p>
                </div>
                <span className="rounded-full bg-[#f6efe5] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#8d5f09]">
                  {reservation.id}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function SectionNumber({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8e630d] text-[11px] font-semibold text-white">
        {number}
      </span>
      <h2 className="font-serif text-[1.75rem] leading-none text-[#21150d]">{title}</h2>
    </div>
  )
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b7b68]">{label}</p>
        <p className="mt-1 text-sm text-[#2b1f16]">{value || "Pendiente de definir"}</p>
      </div>
    </div>
  )
}

function formatDateLabel(value: string) {
  if (!value) return "Selecciona una fecha"

  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}
