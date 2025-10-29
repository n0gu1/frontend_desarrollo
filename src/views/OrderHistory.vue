<template>
  <v-container class="py-6">
    <div class="mb-2">
      <h2 class="text-h5">Mis compras</h2>
      <div class="text-caption text-medium-emphasis">Histórico de órdenes</div>
    </div>

    <!-- estado vacío -->
    <v-card v-if="!loading && orders.length === 0" rounded="xl" class="mt-4">
      <v-card-text class="py-10 text-center">
        <div class="text-body-1 mb-1">Aún no tienes compras.</div>
        <div class="text-caption text-medium-emphasis">Cuando realices una compra, aparecerá aquí.</div>
      </v-card-text>
    </v-card>

    <!-- skeleton inicial -->
    <template v-if="loading && orders.length === 0">
      <v-skeleton-loader type="image, table" class="mb-4" />
      <v-skeleton-loader type="image, table" class="mb-4" />
    </template>

    <!-- listado de órdenes -->
    <v-card
      v-for="o in orders"
      :key="o.id"
      class="mb-4"
      rounded="xl"
      elevation="1"
    >
      <v-card-text>
        <!-- encabezado (sin folio) -->
        <div class="d-flex flex-wrap align-start justify-space-between gap-2">
          <div>
            <div class="text-subtitle-1 font-weight-medium">
              Compra
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatDateOnly(o.creado_en) }} <!-- fecha sin hora -->
            </div>
          </div>

          <div class="text-right">
            <div class="text-caption">Total</div>
            <div class="text-h6">{{ formatMoney(o.total) }}</div>
          </div>
        </div>

        <!-- estado (solo nombre, sin código) -->
        <div class="mt-3">
          <v-chip
            size="small"
            :color="stateColor(o.estado_codigo)"
            variant="tonal"
            class="mr-2"
          >
            {{ o.estado_nombre }}
          </v-chip>
        </div>

        <!-- tabla de ítems -->
        <v-table class="mt-4" density="comfortable">
          <thead>
            <tr>
              <th class="text-left">Producto</th>
              <th class="text-right">Cantidad</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in itemsByOrder[o.id] || []" :key="it.id">
              <td>{{ it.producto_nombre }}</td>
              <td class="text-right">{{ it.cantidad }}</td>
              <td class="text-right">{{ formatMoney(it.precio_unitario) }}</td>
              <td class="text-right">{{ formatMoney(it.subtotal) }}</td>
            </tr>
          </tbody>
        </v-table>

        <!-- acciones (seguimos dejando tracking, aunque el folio no se muestre) -->
        <div class="text-right mt-2">
          <v-btn
            size="small"
            variant="text"
            color="primary"
            :to="`/tracking/${o.folio}`"
          >
            Ver tracking
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- loader de “más” -->
    <div class="text-center my-6" v-if="loading && orders.length > 0">
      <v-progress-circular indeterminate />
    </div>

    <!-- sentinel para autoload -->
    <div ref="sentinel" style="height: 1px;"></div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { get } from '../lib/api'

type Order = {
  id:number; folio:string; total:number; creado_en:string;
  estado_codigo:string; estado_nombre:string
}
type Item  = {
  id:number; orden_id:number; producto_id:number; producto_nombre:string;
  cantidad:number; precio_unitario:number; subtotal:number
}
type Resp  = { total:number; page:number; pageSize:number; orders:Order[]; items:Item[] }

const userId = Number(localStorage.getItem('userId') || '0')

const loading = ref(false)
const page = ref(1)
const pageSize = 12
const total = ref(0)

const orders = ref<Order[]>([])
const itemsByOrder = ref<Record<number, Item[]>>({})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize))
)

function formatMoney(n:number) { return `Q ${Number(n || 0).toFixed(2)}` }
function formatDateOnly(s:string) {
  const d = new Date(s)
  return d.toLocaleDateString() // solo fecha, sin hora
}

function stateColor(code: string) {
  const c = (code || '').toUpperCase()
  if (c === 'READY' || c === 'LIST' ) return 'indigo'
  if (c === 'PROC') return 'amber'
  if (c === 'ENT')  return 'green'
  if (c === 'CRE' || c === 'CREADA') return 'blue'
  return 'grey'
}

function groupByOrder(items: Item[]) {
  const map: Record<number, Item[]> = {}
  for (const it of items) (map[it.orden_id] ||= []).push(it)
  return map
}

async function loadPage(p: number) {
  if (!userId) return
  loading.value = true
  try {
    const r = await get<Resp>(`/api/local/orders/history?usuarioId=${userId}&page=${p}&pageSize=${pageSize}`)
    total.value = r.total ?? 0
    orders.value = p === 1 ? (r.orders ?? []) : [...orders.value, ...(r.orders ?? [])]
    const chunk = groupByOrder(r.items ?? [])
    itemsByOrder.value = p === 1 ? chunk : { ...itemsByOrder.value, ...chunk }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loading.value) return
  if (page.value >= totalPages.value) return
  page.value += 1
  await loadPage(page.value)
}

/** Intersection Observer para autoload */
const sentinel = ref<HTMLDivElement | null>(null)
let io: IntersectionObserver | null = null

onMounted(async () => {
  if (!userId) return
  await loadPage(1)

  io = new IntersectionObserver((entries) => {
    const e = entries[0]
    if (e.isIntersecting) loadMore()
  }, { root: null, rootMargin: '0px', threshold: 1.0 })

  if (sentinel.value) io.observe(sentinel.value)
})

onBeforeUnmount(() => {
  if (io && sentinel.value) io.unobserve(sentinel.value)
  io = null
})
</script>

<style scoped>
/* estilos sutiles, sin folio visible */
</style>
