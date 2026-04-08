"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2, UserRoundPlus } from "lucide-react"
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
import { ApiError, api, type EmployeeRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

type EmployeeFormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: "admin" | "employee"
  salary: number
  password: string
  active: boolean
}

const emptyEmployee: EmployeeFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "employee",
  salary: 0,
  password: "",
  active: true,
}

export default function EmpleadosPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null)
  const [formData, setFormData] = useState<EmployeeFormState>(emptyEmployee)

  const loadEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getEmployees()
      setEmployees(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el directorio del personal.")
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadEmployees()
  }, [])

  const filteredEmployees = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return employees.filter((employee) => {
      return (
        !needle ||
        employee.name.toLowerCase().includes(needle) ||
        employee.email.toLowerCase().includes(needle) ||
        employee.roleLabel.toLowerCase().includes(needle)
      )
    })
  }, [employees, search])

  const metrics = useMemo(() => {
    const active = employees.filter((employee) => employee.active).length
    const admins = employees.filter((employee) => employee.role === "admin").length
    const payroll = employees.reduce((sum, employee) => sum + employee.salary, 0)
    return { total: employees.length, active, admins, payroll }
  }, [employees])

  const openDialog = (employee?: EmployeeRecord) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || "",
        role: employee.role,
        salary: employee.salary,
        password: "",
        active: employee.active,
      })
    } else {
      setEditingEmployee(null)
      setFormData(emptyEmployee)
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setEditingEmployee(null)
    setFormData(emptyEmployee)
    setDialogOpen(false)
  }

  const handleSave = async () => {
    if (!formData.firstName || !formData.email || formData.salary < 0) {
      setError("Completa nombre, correo y salario.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          salary: formData.salary,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {}),
        })
      } else {
        await api.createEmployee({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          salary: formData.salary,
          password: formData.password || undefined,
        })
      }
      closeDialog()
      await loadEmployees()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el empleado.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (employee: EmployeeRecord) => {
    if (!window.confirm(`¿Eliminar a ${employee.name} del sistema?`)) return
    try {
      await api.deleteEmployee(employee.id)
      await loadEmployees()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el empleado.")
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Empleados"
      searchPlaceholder="Buscar personas, roles o correo..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#21150f] md:text-5xl">Gestion del personal</h1>
            <p className="mt-2 max-w-3xl text-base text-[#74685d]">
              El admin puede crear cuentas internas, activar o desactivar empleados y ajustar roles o salarios desde esta vista.
            </p>
          </div>
          <Button onClick={() => openDialog()} className="gap-2">
            <UserRoundPlus className="h-4 w-4" />
            Nuevo empleado
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Equipo total</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.total}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Activos</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{metrics.active}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{metrics.admins}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Nomina mensual estimada</p>
            <p className="mt-2 text-3xl font-semibold">{formatDopCurrency(metrics.payroll)}</p>
          </article>
        </section>

        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {loading && <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando empleados...</div>}

        {!loading && (
          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/40">
                  <tr>
                    {["Empleado", "Rol", "Correo", "Estado", "Salario", "Acciones"].map((heading) => (
                      <th key={heading} className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-t">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">{employee.phone || "Sin telefono"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{employee.roleLabel}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{employee.email}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={employee.active ? "Normal" : "Critico"} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{formatDopCurrency(employee.salary)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => openDialog(employee)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => void handleDelete(employee)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredEmployees.length && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No hay empleados para ese filtro.
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
            <DialogTitle>{editingEmployee ? "Editar empleado" : "Nuevo empleado"}</DialogTitle>
            <DialogDescription>Los cambios se guardan directamente en la base operativa del panel admin.</DialogDescription>
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
                <Label htmlFor="salary">Salario mensual</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  value={formData.salary || ""}
                  onChange={(event) => setFormData((current) => ({ ...current, salary: Number(event.target.value || 0) }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={formData.role} onValueChange={(value: "admin" | "employee") => setFormData((current) => ({ ...current, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingEmployee ? "Nueva contrasena" : "Contrasena inicial"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  placeholder={editingEmployee ? "Opcional" : "123456"}
                />
              </div>
            </div>

            {editingEmployee && (
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="font-medium">Cuenta activa</p>
                  <p className="text-sm text-muted-foreground">Desactiva accesos sin borrar al empleado.</p>
                </div>
                <Switch checked={formData.active} onCheckedChange={(checked) => setFormData((current) => ({ ...current, active: checked }))} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingEmployee ? "Guardar cambios" : "Crear empleado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
