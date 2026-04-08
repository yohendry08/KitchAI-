export interface SessionUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "employee" | "client"
}

const TOKEN_KEY = "kitchai_token"
const USER_KEY = "kitchai_user"
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

const isBrowser = () => typeof window !== "undefined"

const readStorage = (key: string): string | null => {
  if (!isBrowser()) return null
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

const writeStorage = (key: string, value: string, remember = true) => {
  if (!isBrowser()) return
  if (remember) {
    localStorage.setItem(key, value)
    sessionStorage.removeItem(key)
    return
  }
  sessionStorage.setItem(key, value)
  localStorage.removeItem(key)
}

export const saveSession = (token: string, user: SessionUser, remember = true) => {
  if (typeof window === "undefined") return
  writeStorage(TOKEN_KEY, token, remember)
  writeStorage(USER_KEY, JSON.stringify(user), remember)
}

export const getToken = () => {
  const token = readStorage(TOKEN_KEY)
  return token || ""
}

export const getUser = (): SessionUser | null => {
  const raw = readStorage(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export const clearSession = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export const signOut = () => {
  clearSession()
  if (typeof window !== "undefined") {
    window.location.href = "/"
  }
}

const parseAuthError = async (res: Response) => {
  const data = await res.json().catch(() => ({} as { message?: string }))
  const fallback = res.status === 401 ? "Credenciales invalidas" : "No se pudo autenticar"
  const message = typeof data?.message === "string" ? data.message : fallback
  const err = new Error(message) as Error & { status?: number }
  err.status = res.status
  throw err
}

export const loginWithBackend = async (
  email: string,
  password: string,
  remember = true,
): Promise<SessionUser> => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  })

  if (!res.ok) {
    return parseAuthError(res)
  }

  const data = (await res.json()) as { token: string; user: SessionUser }
  saveSession(data.token, data.user, remember)
  return data.user
}

export const hydrateSession = async (): Promise<SessionUser | null> => {
  const token = getToken()
  if (!token) return null

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    clearSession()
    return null
  }

  const user = (await res.json()) as SessionUser
  const remember = Boolean(localStorage.getItem(TOKEN_KEY))
  saveSession(token, user, remember)
  return user
}

export const getRoleLandingPath = (role: SessionUser["role"]) => {
  if (role === "admin") return "/admin"
  if (role === "employee") return "/empleado"
  return "/cliente"
}
