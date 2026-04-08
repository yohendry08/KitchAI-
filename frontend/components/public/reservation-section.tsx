"use client"

import Image from "next/image"
import { type ComponentType, type ReactNode, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const timeSlots = ["12:30", "13:30", "19:00", "20:00", "21:00"]
const guestOptions = ["1 persona", "2 personas", "3 personas", "4 personas", "5 personas", "6+ personas"]

const highlights = [
  {
    icon: ShieldCheck,
    title: "Confirmacion rapida",
    description: "Tu solicitud queda registrada al instante para validacion del equipo.",
  },
  {
    icon: Sparkles,
    title: "Experiencia cuidada",
    description: "Una mesa preparada para cenas especiales, celebraciones y encuentros.",
  },
  {
    icon: MapPin,
    title: "Ubicacion comoda",
    description: "Acceso directo al salon principal con atencion personalizada desde el acceso.",
  },
]

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#8d7d6d]">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b7a795]" />
        {children}
      </div>
    </label>
  )
}

export function ReservationSection() {
  const [submitted, setSubmitted] = useState(false)
  const [selectedTime, setSelectedTime] = useState("19:00")
  const [selectedGuests, setSelectedGuests] = useState("2 personas")

  return (
    <section
      id="reservar"
      className="overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(214,168,102,0.18),_transparent_36%),linear-gradient(180deg,_#faf6ef_0%,_#f6f0e8_52%,_#fbf9f5_100%)] py-24"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:items-start">
          <div className="space-y-10">
            <div className="max-w-xl">
              <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[#a18058]">
                Reserva Para Clientes
              </p>
              <h2 className="mt-4 font-serif text-4xl leading-none text-[#1f120c] md:text-6xl">
                Reserva tu mesa con una experiencia mas cuidada
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-[#705f50]">
                Diseñamos esta sección para que el cliente reserve rápido, vea la propuesta gastronómica y llegue con una expectativa clara de la experiencia en sala.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[30px] shadow-[0_28px_80px_rgba(68,43,24,0.2)]">
              <div className="absolute inset-0">
                <Image
                  src="/images/hero-dish.jpg"
                  alt="Experiencia gastronómica para reservaciones"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,18,9,0.08)_0%,rgba(34,18,9,0.3)_40%,rgba(34,18,9,0.76)_100%)]" />
              <div className="relative flex min-h-[300px] flex-col justify-end p-8 text-white md:min-h-[380px]">
                <span className="mb-5 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.28em] backdrop-blur">
                  Atencion Personalizada
                </span>
                <h3 className="max-w-md font-serif text-4xl leading-[0.95] text-white">
                  Tu mesa lista para una cena memorable.
                </h3>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/84">
                  Elige fecha, hora y número de comensales. Nuestro equipo revisa cada solicitud y confirma la disponibilidad para ofrecerte el mejor servicio.
                </p>
                <div className="mt-6 flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/88">
                  <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 backdrop-blur">
                    Servicio de salon
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 backdrop-blur">
                    Reservas rapidas
                  </span>
                  <span className="rounded-full border border-white/20 bg-black/20 px-4 py-2 backdrop-blur">
                    Menú principal visible
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {highlights.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-white/70 bg-white/70 p-6 shadow-[0_18px_40px_rgba(97,72,42,0.08)] backdrop-blur"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7ecdc] text-[#d49534]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl leading-tight text-[#2a170f]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#7a6a5a]">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pt-10">
            <div className="overflow-hidden rounded-[30px] border border-white/65 bg-white shadow-[0_34px_90px_rgba(75,49,26,0.18)]">
              <div className="rounded-b-[28px] bg-[#36261d] px-6 py-7 text-white md:px-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-white/55">
                  Formulario De Reserva
                </p>
                <h3 className="mt-3 font-serif text-4xl leading-none">Asegura tu mesa</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/72">
                  Completa tus datos y selecciona horario ideal. Si quieres revisar primero los platos, puedes ir al menú principal.
                </p>
              </div>

              {submitted ? (
                <div className="space-y-6 px-6 py-10 md:px-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f4e4cc] text-[#d49534]">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-serif text-3xl text-[#2a170f]">Reserva recibida</h4>
                    <p className="mt-3 text-sm leading-6 text-[#786756]">
                      El equipo revisará disponibilidad y te enviaremos confirmación por correo o teléfono con el siguiente paso.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="h-12 rounded-full bg-[#d49534] px-6 text-sm font-semibold text-white hover:bg-[#bd8128]"
                  >
                    Hacer otra reserva
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSubmitted(true)
                  }}
                  className="space-y-6 px-6 py-7 md:px-8 md:py-8"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Fecha" icon={CalendarDays}>
                      <Input
                        type="date"
                        required
                        className="h-14 rounded-2xl border-[#e7dccd] bg-[#fcfaf7] pl-11 text-sm text-[#2a170f] shadow-none focus-visible:ring-1 focus-visible:ring-[#d49534]"
                      />
                    </Field>

                    <Field label="Invitados" icon={Users}>
                      <select
                        value={selectedGuests}
                        onChange={(e) => setSelectedGuests(e.target.value)}
                        className="h-14 w-full rounded-2xl border border-[#e7dccd] bg-[#fcfaf7] pl-11 pr-4 text-sm text-[#2a170f] outline-none transition focus:border-[#d49534]"
                      >
                        {guestOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#8d7d6d]">
                        Hora preferida
                      </span>
                      <span className="text-xs text-[#a59483]">Sujeto a disponibilidad</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {timeSlots.map((time) => {
                        const isActive = selectedTime === time

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`h-12 rounded-2xl border text-sm font-semibold transition ${
                              isActive
                                ? "border-[#d49534] bg-[#d49534] text-white shadow-[0_14px_26px_rgba(212,149,52,0.32)]"
                                : "border-[#eadfce] bg-white text-[#7e6c5b] hover:border-[#d9bf96] hover:text-[#2a170f]"
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre" icon={User}>
                      <Input
                        type="text"
                        placeholder="Tu nombre"
                        required
                        className="h-14 rounded-2xl border-[#e7dccd] bg-[#fcfaf7] pl-11 text-sm text-[#2a170f] placeholder:text-[#b3a28f] shadow-none focus-visible:ring-1 focus-visible:ring-[#d49534]"
                      />
                    </Field>

                    <Field label="Correo" icon={Mail}>
                      <Input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        required
                        className="h-14 rounded-2xl border-[#e7dccd] bg-[#fcfaf7] pl-11 text-sm text-[#2a170f] placeholder:text-[#b3a28f] shadow-none focus-visible:ring-1 focus-visible:ring-[#d49534]"
                      />
                    </Field>
                  </div>

                  <Field label="Telefono" icon={Phone}>
                    <Input
                      type="tel"
                      placeholder="+52 55 1234 5678"
                      required
                      className="h-14 rounded-2xl border-[#e7dccd] bg-[#fcfaf7] pl-11 text-sm text-[#2a170f] placeholder:text-[#b3a28f] shadow-none focus-visible:ring-1 focus-visible:ring-[#d49534]"
                    />
                  </Field>

                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <Button
                      type="submit"
                      className="h-14 flex-1 rounded-full bg-[#d49534] px-6 text-sm font-semibold text-white hover:bg-[#bd8128]"
                    >
                      Confirmar reserva
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      asChild
                      variant="outline"
                      className="h-14 rounded-full border-[#eadfce] bg-white px-6 text-sm font-medium text-[#5b4a39] hover:bg-[#faf4ec]"
                    >
                      <a href="#menu">Ver platos principales</a>
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-4 rounded-[20px] border border-white/60 bg-white/70 px-5 py-4 text-sm leading-6 text-[#7b6a59] shadow-[0_20px_50px_rgba(83,58,34,0.08)]">
              <span className="font-medium text-[#4c3829]">Horarios sugeridos:</span> almuerzo 12:30 y 13:30, cena 19:00, 20:00 y 21:00. Si necesitas otro horario, puedes indicarlo después en el canal de atención.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
