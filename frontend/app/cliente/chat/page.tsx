"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Paperclip, Send, Smile } from "lucide-react"
import { ClientShell } from "@/components/client/client-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError, api } from "@/lib/api"

const quickActions = [
  {
    label: "Ver menu",
    prompt: "Muéstrame el menú completo y recomiéndame algo según precio y disponibilidad.",
  },
  {
    label: "Reservar mesa",
    prompt: "Crea una reservación para hoy o mañana. Si faltan datos, pídemelos.",
  },
  {
    label: "Mi pedido",
    prompt: "Dime el estado de mi pedido actual y el tiempo estimado de entrega.",
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

export default function ClienteChatPage() {
  return (
    <ClientShell backHref="/cliente">
      <ClienteChatContent />
    </ClientShell>
  )
}

function ClienteChatContent() {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatError, setChatError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = (text?: string) => {
    const messageText = (text ?? input).trim()
    if (!messageText || isLoading) return

    setInput("")
    setChatError(null)
    setMessages((current) => [...current, createMessage("user", messageText)])

    const sendToAssistant = async () => {
      setIsLoading(true)
      try {
        const response = await api.askChat(messageText, "client")
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

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d7740]">Concierge</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight text-[#23160d]">
          Asistencia
          <br />
          Personal
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#6a5a49]">
          Consulta el menu, gestiona una reserva o pide seguimiento de tu orden desde el concierge digital.
        </p>
      </div>

      <div className="flex h-[calc(100vh-16rem)] flex-col overflow-hidden rounded-[30px] bg-white shadow-[0_24px_60px_rgba(80,53,24,0.08)]">
        <div className="flex items-center gap-3 border-b border-[#efe4d7] px-5 py-4">
          <Avatar className="h-11 w-11 rounded-2xl">
            <AvatarFallback className="rounded-2xl bg-[#f3e3c6] text-[#8d5f09]">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-[#21150d]">Concierge KitchAI</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-[#567a67]">
              <span className="h-2 w-2 rounded-full bg-[#3fa56e]" />
              Disponible ahora
            </p>
          </div>
        </div>

        {chatError ? <div className="border-b border-[#f2d6ce] bg-[#fff3ef] px-5 py-3 text-sm text-[#a13c2a]">{chatError}</div> : null}

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="rounded-[24px] bg-[#f7f1e9] p-5 text-sm leading-7 text-[#36261b]">
              <p className="font-semibold text-[#8d5f09]">Bienvenido a KitchAI</p>
              <p className="mt-2">
                Puedo ayudarte con la carta, las reservaciones, el estado de tus pedidos y recomendaciones del chef.
              </p>
            </div>
          ) : null}

          {messages.map((message) => {
            const isAssistant = message.role === "assistant"

            return (
              <div key={message.id} className={`flex gap-3 ${isAssistant ? "" : "justify-end"}`}>
                {isAssistant ? (
                  <Avatar className="h-8 w-8 rounded-2xl">
                    <AvatarFallback className="rounded-2xl bg-[#f3e3c6] text-[#8d5f09]">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : null}
                <div
                  className={`max-w-[82%] rounded-[22px] px-4 py-3 text-sm leading-6 ${
                    isAssistant ? "bg-[#f5efe7] text-[#2a1e16]" : "bg-[#94660d] text-white"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            )
          })}

          {isLoading ? (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 rounded-2xl">
                <AvatarFallback className="rounded-2xl bg-[#f3e3c6] text-[#8d5f09]">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 rounded-[20px] bg-[#f5efe7] px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#917f6d]/60 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#917f6d]/60 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#917f6d]/60 [animation-delay:300ms]" />
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 ? (
          <div className="px-5 pb-3">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => {
                    setInput(action.prompt)
                    inputRef.current?.focus()
                  }}
                  className="rounded-full border border-[#eadfce] bg-[#fffaf5] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#8d5f09]"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-[#efe4d7] px-4 py-4">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Adjuntar">
              <Paperclip className="h-4 w-4 text-[#8f8070]" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Emojis">
              <Smile className="h-4 w-4 text-[#8f8070]" />
            </Button>
            <Input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu mensaje..."
              className="h-11 rounded-full border-[#eadfce] bg-[#fffaf5]"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-full bg-[#8f630e] text-white hover:bg-[#7d560d]"
              aria-label="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  )
}
