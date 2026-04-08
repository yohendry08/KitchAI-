"use client"

import React from "react"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChefHat, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, api } from "@/lib/api"
import { getRoleLandingPath, loginWithBackend } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      await api.register({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
      })
      setSuccessMessage("Cuenta creada. Entrando a tu experiencia...")
      const user = await loginWithBackend(email, password)
      router.push(getRoleLandingPath(user.role))
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          setErrorMessage("Verifica los datos requeridos para completar el registro.")
        } else if (error.status === 409) {
          setErrorMessage("El correo ya esta registrado.")
        } else {
          setErrorMessage(error.message || "Error del servidor al registrar usuario.")
        }
      } else if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("No se pudo completar el registro.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 lg:block">
        <div
          className="relative h-full bg-cover bg-center"
          style={{ backgroundImage: "url(/images/reservation-ambience.jpg)" }}
        >
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative z-10 flex h-full flex-col justify-end p-12">
            <h2 className="max-w-md font-serif text-3xl font-bold text-primary-foreground leading-tight">
              Unete a KitchAI
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/80 leading-relaxed">
              Crea tu cuenta para reservar mesas, ver el menu y disfrutar de una experiencia personalizada.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-serif font-bold text-foreground">KitchAI</span>
          </Link>

          <h1 className="font-serif text-2xl font-bold text-foreground">Crear Cuenta</h1>
          <p className="mt-2 text-muted-foreground">
            Completa tus datos para registrarte como cliente
          </p>

          <form onSubmit={handleRegister} className="mt-8 flex flex-col gap-5">
            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  placeholder="Juan"
                  className="rounded-lg border-border"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  placeholder="Perez"
                  className="rounded-lg border-border"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="rounded-lg border-border"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 890"
                className="rounded-lg border-border"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contrasena</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  className="rounded-lg border-border pr-10"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 py-6"
            >
              {isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Inicia Sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
