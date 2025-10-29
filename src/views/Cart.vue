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
                  <v-btn size="small" variant="tonal" icon="mdi-minus" :disabled="busyIds.has(it.id) || it.cantidad <= 1"
                    @click="dec(it)" />
                  <v-text-field v-model.number="qtyDraft[it.id]" type="number" min="1" hide-details density="compact"
                    style="max-width:80px" @blur="applyDraft(it)" @keyup.enter="applyDraft(it)" />
                  <v-btn size="small" variant="tonal" icon="mdi-plus" :disabled="busyIds.has(it.id)" @click="inc(it)" />
                </div>
              </td>
              <td class="text-right">Q {{ fmt(it.subtotal) }}</td>
              <td class="text-center">
                <v-btn :loading="busyIds.has(it.id)" color="error" variant="text" icon="mdi-delete"
                  @click="removeItem(it)" />
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
import { get, put, del } from '../lib/api' // helper existente
import { useRouter } from 'vue-router'

const router = useRouter()
const usuarioId = Number(localStorage.getItem('userId') || '0')
if (!usuarioId) {
  // Redirige a login o muestra error
  router.push('/login')
}


type Item = {
  id: number
  producto_id: number
  nombre: string | null
  cantidad: number
  precio_unitario: number
  subtotal: number
}

const items = ref<Item[]>([])
const total = ref(0)
const error = ref('')
const busyIds = ref<Set<number>>(new Set())
const qtyDraft = ref<Record<number, number>>({})

function fmt(n: number) {
  return n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function load() {
  error.value = ''
  try {
    // Usa el endpoint local que ya tienes documentado: GET /api/local/cart?usuarioId=#
    const r = await get<{ carritoId?: number, items: Item[], total: number }>(`/api/local/cart?usuarioId=${usuarioId}`)
    items.value = r.items || []
    total.value = r.total || 0
    qtyDraft.value = {}
    for (const it of items.value) qtyDraft.value[it.id] = it.cantidad
  } catch (e: any) {
    error.value = e?.message || 'Error cargando carrito'
  }
}

async function updateQty(it: Item, cantidad: number) {
  if (cantidad < 1) cantidad = 1
  busyIds.value.add(it.id)
  try {
    // PUT /api/local/cart/items/{itemId} { cantidad }
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
  const v = Number(qtyDraft.value[it.id] ?? it.cantidad)
  if (!Number.isFinite(v) || v < 1) { qtyDraft.value[it.id] = it.cantidad; return }
  if (v !== it.cantidad) updateQty(it, v)
}

async function removeItem(it: Item) {
  busyIds.value.add(it.id)
  try {
    // DELETE /api/local/cart/items/{itemId}
    await del(`/api/local/cart/items/${it.id}`)
    await load()
  } catch (e: any) {
    error.value = e?.message || 'No se pudo eliminar el ítem'
  } finally {
    busyIds.value.delete(it.id)
  }
}

function goCheckout() {
  // Aquí rediriges a tu paso de checkout (cuando lo tengas)
  // Por ahora lo dejamos en /customize o donde corresponda:
  router.push('/customize')
}

onMounted(load)
</script>

<style scoped>
.debug {
  white-space: pre-wrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
