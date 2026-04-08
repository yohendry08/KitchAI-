"use client"

import { useEffect, useRef, useState } from "react"
import { Send, Bot } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ApiError, api } from "@/lib/api"

const QUICK_ACTIONS = [
  {
    label: "Ver menú del día",
    prompt: "Muestra el menú del día y los platos más recomendados.",
  },
  {
    label: "Estado del inventario",
    prompt: "Resume el estado del inventario y señala los insumos con stock bajo o crítico.",
  },
  {
    label: "Pedidos pendientes",
    prompt: "Muestra los pedidos pendientes y en proceso con su estado actual.",
  },
  {
    label: "Actualizar pedido",
    prompt: "Actualiza el estado del pedido #0001 a Entregado. Si falta el id o estado, pídemelos.",
  },
]

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

const createMessage = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
})

export default function EmpleadoChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatError, setChatError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = (text?: string) => {
    const msgText = (text ?? input).trim()
    if (!msgText || isLoading) return
    setInput("")
    setChatError(null)

    setMessages((current) => [...current, createMessage("user", msgText)])

    const sendToAssistant = async () => {
      setIsLoading(true)
      try {
        const response = await api.askChat(msgText, "employee")
        setMessages((current) => [...current, createMessage("assistant", response.answer)])
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "No se pudo consultar el asistente."
        setChatError(message)
        setMessages((current) => [...current, createMessage("assistant", message)])
      } finally {
        setIsLoading(false)
      }
    }

    void sendToAssistant()
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <DashboardLayout role="employee" userName="Maria Gomez" userRole="Mesero" title="Chat de Asistencia">
      <div className="flex flex-col h-[calc(100vh-12rem)] rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-6 py-4 shrink-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">KitchAI — Asistente Interno</p>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              En línea · Modo Empleado
            </p>
          </div>
        </div>

        {chatError && (
          <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-3 text-sm text-destructive">
            {chatError}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-primary/15 bg-primary/5 p-6 text-sm leading-7 text-foreground">
              <p className="font-semibold text-primary">Asistente interno listo</p>
              <p className="mt-2">
                Puedo ayudarte con inventario, pedidos, reservas y procedimientos del turno.
              </p>
            </div>
          ) : null}

          {messages.map((msg) => {
            const isBot = msg.role === "assistant"

            return (
              <div key={msg.id} className={`flex items-start gap-3 ${!isBot ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback
                    className={`text-xs font-semibold ${
                      isBot ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isBot ? <Bot className="h-4 w-4" /> : "MG"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    !isBot
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="border-t border-border px-6 py-3 shrink-0">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Acciones rápidas</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleQuickAction(action.prompt)}
                disabled={isLoading}
                className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border p-4 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Consulta sobre el turno, menú o procedimientos..."
              className="flex-1 rounded-full border-border"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              aria-label="Enviar mensaje"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
