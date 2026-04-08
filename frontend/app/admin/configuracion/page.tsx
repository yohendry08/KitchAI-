"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, UserCog } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ApiError, api, type AccountRecord } from "@/lib/api"

type AccountFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: "admin" | "employee" | "client"
  active: boolean
  salary: number
  password: string
}

const emptyAccount: AccountFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "client",
  active: true,
  salary: 0,
  password: "",
}

export default function ConfiguracionPage() {
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("Todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null)
  const [formData, setFormData] = useState<AccountFormState>(emptyAccount)
  const [isSaving, setIsSaving] = useState(false)

  const loadAccounts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getAccounts("", "Todos")
      setAccounts(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar las cuentas.")
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAccounts()
  }, [])

  const filteredAccounts = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return accounts.filter((account) => {
      const matchSearch =
        !needle ||
        account.name.toLowerCase().includes(needle) ||
        account.email.toLowerCase().includes(needle) ||
        account.roleLabel.toLowerCase().includes(needle)
      const matchRole = roleFilter === "Todos" || account.role === roleFilter
      return matchSearch && matchRole
    })
  }, [accounts, roleFilter, search])

  const metrics = useMemo(() => {
    const active = accounts.filter((account) => account.active).length
    const staff = accounts.filter((account) => account.role !== "client").length
    const clients = accounts.filter((account) => account.role === "client").length
    return { total: accounts.length, active, staff, clients }
  }, [accounts])

  const openDialog = (account?: AccountRecord) => {
    if (account) {
      setEditingAccount(account)
      setFormData({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: account.phone || "",
        role: account.role,
        active: account.active,
        salary: account.salary || 0,
        password: "",
      })
    } else {
      setEditingAccount(null)
      setFormData(emptyAccount)
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setEditingAccount(null)
    setFormData(emptyAccount)
    setDialogOpen(false)
  }

  const handleSave = async () => {
    if (!formData.firstName || !formData.email) {
      setError("Completa nombre y correo de la cuenta.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        active: formData.active,
        salary: formData.role === "client" ? undefined : formData.salary,
        ...(formData.password ? { password: formData.password } : {}),
      }

      if (editingAccount) {
        await api.updateAccount(editingAccount.id, payload)
      } else {
        await api.createAccount(payload)
      }

      closeDialog()
      await loadAccounts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la cuenta.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (account: AccountRecord) => {
    if (!window.confirm(`¿Eliminar la cuenta ${account.email}?`)) return
    try {
      await api.deleteAccount(account.id)
      await loadAccounts()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar la cuenta.")
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Cuentas"
      searchPlaceholder="Buscar cuentas, roles o correo..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#21150f] md:text-5xl">Cuentas y accesos</h1>
            <p className="mt-2 max-w-3xl text-base text-[#74685d]">
              Desde aqui el administrador controla accesos, roles, activacion y cuentas internas o de clientes.
            </p>
          </div>
          <Button onClick={() => openDialog()} className="gap-2">
            <UserCog className="h-4 w-4" />
            Nueva cuenta
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Cuentas totales</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.total}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Activas</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{metrics.active}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Staff interno</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{metrics.staff}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Clientes registrados</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.clients}</p>
          </article>
        </section>

        <section className="flex flex-wrap gap-2">
          {["Todos", "admin", "employee", "client"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-full border px-4 py-2 text-sm ${
                roleFilter === role ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {role === "Todos" ? "Todos" : role}
            </button>
          ))}
        </section>

        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {loading && <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando cuentas...</div>}

        {!loading && (
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-muted/40">
                  <tr>
                    {["Cuenta", "Rol", "Estado", "Correo", "Perfil laboral", "Acciones"].map((heading) => (
                      <th key={heading} className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="border-t">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.phone || "Sin telefono"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{account.roleLabel}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={account.active ? "Normal" : "Critico"} />
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{account.email}</td>
                      <td className="px-6 py-4 text-sm">
                        {account.employeeId ? `Vinculada a empleado · ${account.salary ?? 0}` : "Cuenta de cliente"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => openDialog(account)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => void handleDelete(account)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredAccounts.length && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No hay cuentas para este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle>
            <DialogDescription>Define rol, activacion y credenciales de acceso de la cuenta.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input id="firstName" value={formData.firstName} onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input id="lastName" value={formData.lastName} onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={formData.email} onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" value={formData.phone} onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "employee" | "client") => setFormData((current) => ({ ...current, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.role !== "client" && (
              <div className="space-y-2">
                <Label htmlFor="salary">Salario mensual</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  value={formData.salary || ""}
                  onChange={(event) => setFormData((current) => ({ ...current, salary: Number(event.target.value || 0) }))}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{editingAccount ? "Nueva contrasena" : "Contrasena inicial"}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingAccount ? "Opcional" : "123456"}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">Cuenta activa</p>
                <p className="text-sm text-muted-foreground">Si se desactiva, el usuario pierde acceso al sistema.</p>
              </div>
              <Switch checked={formData.active} onCheckedChange={(checked) => setFormData((current) => ({ ...current, active: checked }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingAccount ? "Guardar cambios" : "Crear cuenta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
