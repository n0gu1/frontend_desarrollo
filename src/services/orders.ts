// proyecto-final/src/services/orders.ts
import { get } from '../lib/api'

export type FetchOrdersParams = {
  status?: string | null
  q?: string | null
  from?: string | null // yyyy-mm-dd
  to?: string | null   // yyyy-mm-dd
  page?: number
  pageSize?: number
}

export type FetchOrdersResult = {
  items: any[]
  page: number
  pages: number
  total: number
  pageSize: number
}

const DEBUG_DISCOVERY = true;

/* Rutas candidatas que he visto en tus logs/proyecto */
const ROUTES = [
  '/Local/orders',
  '/Local/Orders',
  '/Local/ordenes',
  '/api/local/orders',
  '/api/local/Orders',
  '/api/local/ordenes',
  '/api/orders',
  '/orders',
  '/ordenes',
  '/Local/orders/list',
  '/api/local/orders/list',
];

/* Variantes de nombres de parámetros */
const PARAMS: Array<Record<string, string>> = [
  { status: 'status', q: 'q', from: 'from', to: 'to', page: 'page', pageSize: 'pageSize' },
  { status: 'estado', q: 'search', from: 'desde', to: 'hasta', page: 'page', pageSize: 'limit' },
  { status: 'estado', q: 'q', from: 'start', to: 'end', page: 'pagina', pageSize: 'tam' },
];

function mapStatus(s?: string | null): string | null {
  if (!s || s.toUpperCase() === 'TODOS') return null;
  // por si en backend usan minúsculas
  return s.toUpperCase();
}

function buildQuery(p: FetchOrdersParams, m: Record<string,string>): string {
  const q = new URLSearchParams();
  const uid = Number(localStorage.getItem('userId') || '0');

  const status = mapStatus(p.status);
  if (status) q.set(m.status, status);
  if (p.q) q.set(m.q, p.q);
  if (p.from) q.set(m.from, p.from);
  if (p.to) q.set(m.to, p.to);
  if (p.page && p.page > 0) q.set(m.page, String(p.page));
  if (p.pageSize && p.pageSize > 0) q.set(m.pageSize, String(p.pageSize));
  if (uid) q.set('usuarioId', String(uid)); // muchos endpoints tuyos lo piden

  // compat extra
  if (!q.has('pageSize') && p.pageSize) q.set('per_page', String(p.pageSize));
  if (!q.has('page') && p.page && p.pageSize) {
    q.set('offset', String((p.page - 1) * p.pageSize));
  }

  const s = q.toString();
  return s ? `?${s}` : '';
}

function normalize(body: any, fallback: FetchOrdersParams): FetchOrdersResult {
  const items = body?.items ?? body?.data ?? (Array.isArray(body) ? body : []) ?? [];
  const total = Number(
    body?.total ?? body?.totalCount ?? body?.total_items ?? (Array.isArray(items) ? items.length : 0)
  );
  const pageSize = Number(body?.pageSize ?? body?.page_size ?? body?.limit ?? fallback.pageSize ?? 20);
  const page = Number(body?.page ?? body?.pagina ?? fallback.page ?? 1);
  const pages = Number(body?.pages ?? (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1));
  return { items, page, pages, total, pageSize };
}

export async function fetchOrders(params: FetchOrdersParams): Promise<FetchOrdersResult> {
  const p: FetchOrdersParams = {
    status: params.status ?? null,
    q: params.q ?? null,
    from: params.from ?? null,
    to: params.to ?? null,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };

  const attempts: string[] = [];

  for (const route of ROUTES) {
    for (const variant of PARAMS) {
      const url = `${route}${buildQuery(p, variant)}`;
      attempts.push(url);
      try {
        if (DEBUG_DISCOVERY) console.debug('[orders] GET', url);
        const body = await get<any>(url);
        if (DEBUG_DISCOVERY) console.debug('[orders] OK', url, body);
        return normalize(body, p);
      } catch (e: any) {
        const msg = String(e?.message || '');
        if (DEBUG_DISCOVERY) console.debug('[orders] FAIL', url, msg);
        // seguimos probando
        continue;
      }
    }
  }

  // Nada respondió: mostramos última URL para el alert y todas en consola
  if (DEBUG_DISCOVERY) {
    console.error('[orders] Ninguna ruta respondió. Intentos:', attempts);
  }
  throw new Error('HTTP 404');
}
