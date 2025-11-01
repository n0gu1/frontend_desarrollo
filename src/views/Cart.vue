<!-- proyecto-final/src/views/Cart.vue -->
<template>
  <v-row justify="center">
    <v-col cols="12" md="10" lg="8">
      <v-card class="pa-4" rounded="xl" elevation="8">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-h6">Carrito</div>
          <v-btn to="/shop" variant="text" prepend-icon="mdi-store">Seguir comprando</v-btn>
        </div>

        <v-alert v-if="error" type="error" class="mb-3" density="comfortable">
          {{ error }}
        </v-alert>

        <v-table v-if="items.length">
          <thead>
            <tr>
              <th class="text-left">Producto</th>
              <th class="text-right">Precio</th>
              <th class="text-center" style="width:200px">Cantidad</th>
              <th class="text-right">Subtotal</th>
              <th class="text-center" style="width:80px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in items" :key="it.id">
              <td>{{ it.nombre || ('#' + it.producto_id) }}</td>
              <td class="text-right">Q {{ fmt(it.precio_unitario) }}</td>
              <td class="text-center">
                <div class="d-flex align-center justify-center ga-2">
                  <v-btn
                    size="small"
                    variant="tonal"
                    icon="mdi-minus"
                    :disabled="busyIds.has(it.id) || it.cantidad <= 1"
                    @click="dec(it)"
                  />
                  <v-text-field
                    v-model.number="qtyDraft[it.id]"
                    type="number"
                    min="1"
                    hide-details
                    density="compact"
                    style="max-width:80px"
                    @blur="applyDraft(it)"
                    @keyup.enter="applyDraft(it)"
                  />
                  <v-btn
                    size="small"
                    variant="tonal"
                    icon="mdi-plus"
                    :disabled="busyIds.has(it.id)"
                    @click="inc(it)"
                  />
                </div>
              </td>
              <td class="text-right">Q {{ fmt(it.subtotal) }}</td>
              <td class="text-center">
                <v-btn
                  :loading="busyIds.has(it.id)"
                  color="error"
                  variant="text"
                  icon="mdi-delete"
                  @click="removeItem(it)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-alert v-else type="info" class="mb-3" density="comfortable">
          Tu carrito está vacío.
        </v-alert>

        <v-divider class="my-4" />

        <div class="d-flex align-center justify-space-between">
          <div class="text-body-2">Ítems: {{ items.length }}</div>
          <div class="text-h6">Total: Q {{ fmt(total) }}</div>
        </div>

        <div class="d-flex justify-end mt-4">
          <v-btn color="primary" class="mt-4" @click="router.push('/checkout')" :disabled="!items.length">
            Proceder al checkout
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get, put, del, post } from '../lib/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const usuarioId = Number(localStorage.getItem('userId') || '0')
if (!usuarioId) router.push('/login')

type Item = {
  id: number
  producto_id: number
  nombre: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

const OBJETIVO_PRODUCTO_ID = 3

const items = ref<Item[]>([])
const total = ref(0)
const error = ref('')
const busyIds = ref<Set<number>>(new Set())
const qtyDraft = ref<Record<number, number>>({})

function toNum(n: any) { const x = Number(n); return Number.isFinite(x) ? x : 0 }
function fmt(n: number) {
  return toNum(n).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* === NUEVO: asegura que exista draftItem:<uid> para que el checkout
       pueda usarlo como fallback de personalizaciones === */
function ensureDraftId() {
  const key = `draftItem:${usuarioId}`
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, String(Date.now()))
  }
}

async function ensureItemObjetivo() {
  // Intenta crear el ítem de producto 3 en el carrito del usuario
  try {
    try {
      await post('/api/local/cart/items', { usuarioId, productoId: OBJETIVO_PRODUCTO_ID, cantidad: 1 })
      return
    } catch (e1) {
      try {
        await post('/api/local/cart/add', { usuarioId, productoId: OBJETIVO_PRODUCTO_ID, cantidad: 1 })
        return
      } catch (e2) {
        await post('/api/cart/add', { usuarioId, productoId: OBJETIVO_PRODUCTO_ID, cantidad: 1 })
        return
      }
    }
  } catch (e: any) {
    error.value = e?.message || 'No se pudo agregar el producto #3 automáticamente'
  }
}

async function load() {
  error.value = ''
  try {
    // ⬇️ Usa el preview del backend nuevo
    const r = await get<{ carritoId?: number; items: Item[]; total: number }>(
      `/api/local/cart/preview?usuarioId=${usuarioId}`
    )
    const all = Array.isArray(r.items) ? r.items : []

    let filtered = all.filter(it => toNum(it.producto_id) === OBJETIVO_PRODUCTO_ID)

    // Si no está, créalo y vuelve a cargar una vez
    if (!filtered.length) {
      await ensureItemObjetivo()
      const r2 = await get<{ items: Item[]; total: number }>(`/api/local/cart/preview?usuarioId=${usuarioId}`)
      filtered = (r2.items || []).filter(it => toNum(it.producto_id) === OBJETIVO_PRODUCTO_ID)
    }

    items.value = filtered
    total.value = filtered.reduce(
      (s, it) => s + (toNum(it.subtotal) || toNum(it.precio_unitario) * toNum(it.cantidad)),
      0
    )

    qtyDraft.value = {}
    for (const it of items.value) qtyDraft.value[it.id] = it.cantidad

    /* === NUEVO: guarda el último carrito_item.id encontrado para este usuario
           (útil para depurar o si quieres mostrarlo en el checkout) === */
    if (items.value.length) {
      localStorage.setItem(`lastItemId:${usuarioId}`, String(items.value[0].id))
    }
  } catch (e: any) {
    error.value = e?.message || 'Error cargando carrito'
  }
}

async function updateQty(it: Item, cantidad: number) {
  if (cantidad < 1) cantidad = 1
  busyIds.value.add(it.id)
  try {
    await put(`/api/local/cart/items/${it.id}`, { cantidad })
    await load()
  } catch (e: any) {
    error.value = e?.message || 'No se pudo actualizar la cantidad'
  } finally {
    busyIds.value.delete(it.id)
  }
}

function inc(it: Item) { updateQty(it, it.cantidad + 1) }
function dec(it: Item) { if (it.cantidad > 1) updateQty(it, it.cantidad - 1) }

function applyDraft(it: Item) {
  const v = toNum(qtyDraft.value[it.id] ?? it.cantidad)
  if (!Number.isFinite(v) || v < 1) { qtyDraft.value[it.id] = it.cantidad; return }
  if (v !== it.cantidad) updateQty(it, v)
}

async function removeItem(it: Item) {
  busyIds.value.add(it.id)
  try {
    await del(`/api/local/cart/items/${it.id}`)
    await load()
  } catch (e: any) {
    error.value = e?.message || 'No se pudo eliminar el ítem'
  } finally {
    busyIds.value.delete(it.id)
  }
}

onMounted(async () => {
  ensureDraftId()
  await load()
})
</script>

<style scoped>
.debug {
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
