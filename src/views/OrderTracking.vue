<!-- src/views/OrderTracking.vue -->
<template>
  <v-container class="py-6" v-if="loaded">
    <!-- Header con accesos a /shop -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div>
        <h2 class="text-h5 mb-1">Seguimiento de la orden {{ folio }}</h2>
      </div>

      <div class="d-flex ga-2">
        <!-- Botón a /shop por PATH (no requiere nombre de ruta) -->
        <v-btn
          variant="outlined"
          color="secondary"
          prepend-icon="mdi-storefront"
          class="text-none"
          :to="'/shop'"
        >
          Ir a la tienda
        </v-btn>
      </div>
    </div>

    <!-- Estado / total -->
    <v-card class="mb-6" rounded="xl">
      <v-card-text>
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-subtitle-1 font-weight-medium">Estado actual</div>
            <div class="text-h6">
              {{ orden.estado_nombre || '—' }}
            </div>
            <small class="text-grey">Código: {{ orden.estado_codigo || '—' }}</small>
          </div>
          <div class="text-right">
            <div>Total</div>
            <div class="text-h6">Q {{ Number(orden.total || 0).toFixed(2) }}</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Progreso -->
    <v-card class="mb-6" rounded="xl">
      <v-card-title class="text-subtitle-1">Progreso</v-card-title>
      <v-card-text>
        <v-stepper v-model="activeStep" alt-labels>
          <v-stepper-header>
            <template v-for="s in sortedSteps" :key="s.codigo">
              <v-stepper-item
                :complete="isComplete(s)"
                :value="s.paso_publico"
                :title="s.nombre"
              />
              <v-divider v-if="s.paso_publico !== sortedSteps.length" />
            </template>
          </v-stepper-header>
        </v-stepper>
        <small class="text-grey">
          Última actualización: {{ lastUpdateText }}
        </small>
      </v-card-text>
    </v-card>

    <!-- Eventos -->
    <v-card rounded="xl">
      <v-card-title class="text-subtitle-1">Eventos de entrega</v-card-title>
      <v-card-text>
        <div v-if="eventos.length === 0">Aún no hay eventos.</div>
        <v-list v-else density="compact">
          <v-list-item v-for="ev in eventos" :key="ev.id">
            <v-list-item-title>
              {{ formatDate(ev.creado_en) }} — ({{ ev.lat ?? '—' }}, {{ ev.lng ?? '—' }})
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- FAB fijo para /shop (siempre visible) -->
    <v-btn
      class="fab-shop"
      icon
      size="large"
      color="secondary"
      :to="'/shop'"
      aria-label="Ir a la tienda"
    >
      <v-icon icon="mdi-storefront" />
    </v-btn>
  </v-container>

  <v-container v-else class="text-center py-10">
    <v-progress-circular indeterminate />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { get } from '../lib/api'

/* ---- Tipos ---- */
type Step = { codigo: string; nombre: string; paso_publico: number }
type Evento = { id: number; lat: number | null; lng: number | null; creado_en: string }
type OrdenDTO = {
  id: number
  folio: string
  total: number
  estado_codigo: string
  estado_nombre: string
  paso_publico: number | null
}
type TrackingResp = {
  orden: OrdenDTO
  entrega?: any
  eventos: Evento[]
  steps: Step[]
}

/* ---- Estado ---- */
const route = useRoute()
const folio = String(route.params.folio || '')
const data = ref<TrackingResp | null>(null)
const loaded = ref(false)
const timer = ref<number | null>(null)

/* ---- Envoltorios seguros ---- */
const orden = computed<OrdenDTO>(() =>
  data.value?.orden ?? {
    id: 0,
    folio: '',
    total: 0,
    estado_codigo: '',
    estado_nombre: '',
    paso_publico: 1
  }
)
const eventos = computed<Evento[]>(() => data.value?.eventos ?? [])
const steps = computed<Step[]>(() => data.value?.steps ?? [])

/* ---- Progreso ---- */
const sortedSteps = computed<Step[]>(() =>
  steps.value.slice().sort((a, b) => a.paso_publico - b.paso_publico)
)

const activeStep = ref<number>(1)

/**
 * Determina el paso activo:
 * 1) Si backend trae orden.paso_publico válido, lo usa.
 * 2) Si no, intenta mapear por codigo (CRE / PROC / LISTO / ENT, etc.)
 * 3) Si nada funciona, deja 1.
 */
function resolveActiveStep(): number {
  const p = Number(orden.value.paso_publico || 0)
  if (p > 0) return p

  const code = (orden.value.estado_codigo || '').toUpperCase()
  if (!code || sortedSteps.value.length === 0) return 1

  const found = sortedSteps.value.find(s => (s.codigo || '').toUpperCase() === code)
  return found?.paso_publico || 1
}

function isComplete(s: Step) {
  const cur = activeStep.value || 1
  return s.paso_publico <= cur
}

const lastUpdateText = computed(() => {
  const ts = eventos.value[0]?.creado_en
  return ts ? new Date(ts).toLocaleString() : '—'
})

function formatDate(s: string) {
  try { return new Date(s).toLocaleString() } catch { return s }
}

/* ---- Fetch ---- */
async function fetchTracking() {
  try {
    const r = await get<TrackingResp>(`/api/local/orders/${folio}/tracking`)
    data.value = r
    activeStep.value = resolveActiveStep()
  } catch (e) {
    console.error('tracking error', e)
  } finally {
    loaded.value = true
  }
}

/* ---- Ciclo de vida ---- */
onMounted(() => {
  fetchTracking()
  // refresco cada 3s
  timer.value = window.setInterval(fetchTracking, 3000) as unknown as number
})
onBeforeUnmount(() => {
  if (timer.value) window.clearInterval(timer.value)
})

// Si cambian params (otro folio), recargar
watch(
  () => route.params.folio,
  newFolio => {
    if (!newFolio) return
    loaded.value = false
    data.value = null
    activeStep.value = 1
    fetchTracking()
  }
)
</script>

<style scoped>
.fab-shop{
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 1100;
  box-shadow: 0 6px 24px rgba(0,0,0,.25);
}
</style>
