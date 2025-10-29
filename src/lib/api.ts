// src/lib/api.ts
type Json = Record<string, any>

const API_BASE_RAW = import.meta.env.VITE_API_URL || ''
const API_BASE = API_BASE_RAW.replace(/\/+$/, '') // sin barra al final

function buildUrl(path: string) {
  if (!path.startsWith('/')) path = '/' + path
  // Evita /api duplicado si API_BASE ya termina en /api
  if (API_BASE.endsWith('/api') && path.startsWith('/api/')) {
    return API_BASE + path.slice(4)
  }
  return API_BASE + path
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch {}
  if (!res.ok) {
    const err: any = new Error((data && (data.message || data.error)) || `HTTP ${res.status}`)
    err.status = res.status
    err.body = data ?? text
    throw err
  }
  return data as T
}

// Si recibe 404 en /api/... reintenta sin /api (por si el backend no usa prefijo)
async function request<T = Json>(
  path: string,
  init: RequestInit & { _triedAlt?: boolean } = {}
): Promise<T> {
  const url = buildUrl(path)
  const id = Math.random().toString(36).slice(2, 10)
  console.debug(`[api:${id}] ${init.method || 'GET'} → ${url}`)

  const res = await fetch(url, init)
  if (res.status === 404 && path.startsWith('/api/') && !init._triedAlt) {
    const altPath = path.replace(/^\/api\//, '/')
    const altUrl = buildUrl(altPath)
    console.warn(`[api:${id}] 404 en ${url} → reintento en ${altUrl}`)
    return request<T>(altPath, { ...init, _triedAlt: true })
  }

  console.debug(`[api:${id}] status=${res.status}`)
  return parse<T>(res)
}

export async function get<T = Json>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export async function post<T = Json>(path: string, body?: Json): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function put<T = Json>(path: string, body?: Json): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function del<T = Json>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' })
}
