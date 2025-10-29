<template>
  <v-container class="py-6">
    <h2 class="text-h5 mb-6">Panel simple de tracking</h2>

    <!-- Folio + acciones -->
    <v-card rounded="xl" class="mb-6">
      <v-card-text>
        <div class="d-flex gap-3 align-center">
          <v-text-field
            v-model="folio"
            label="Folio (p. ej. 20251018-7458)"
            variant="solo-filled"
            class="flex-grow-1"
            clearable
          />
          <v-btn color="primary" @click="loadTracking" :loading="loading">CARGAR</v-btn>
          <v-btn :color="auto ? 'primary' : undefined" variant="tonal" @click="toggleAuto">
            AUTO-ACTUALIZAR
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Estado actual -->
    <v-card rounded="xl" class="mb-6" v-if="data">
      <v-card-text class="d-flex justify-space-between">
        <div>
          <div class="text-subtitle-1 font-weight-medium">Estado actual</div>
          <div class="text-h6">{{ data.orden?.estado_nombre || '—' }}</div>
          <div class="text-caption text-grey">Código: {{ data.orden?.estado_codigo || '—' }}</div>
        </div>
        <div class="text-right">
          <div>Total</div>
          <div class="text-h6">Q {{ Number(data.orden?.total || 0).toFixed(2) }}</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Avanzar estado -->
    <v-card rounded="xl" class="mb-6" v-if="data">
      <v-card-text>
        <div class="text-subtitle-1 mb-3">Avanzar estado</div>

        <div class="d-flex flex-wrap gap-3">
          <v-btn color="primary" class="mr-2" @click="setState('PROC')" :loading="actLoading">
            EN PROCESO
          </v-btn>
          <v-btn color="primary" variant="tonal" class="mr-2" @click="setState('ASIG')" :loading="actLoading">
            ASIGNADO
          </v-btn>
          <v-btn color="primary" variant="tonal" class="mr-2" @click="setState('EN_RUTA')" :loading="actLoading">
            EN_RUTA
          </v-btn>
          <v-btn color="primary" variant="tonal" class="mr-2" @click="setState('READY')" :loading="actLoading">
            LISTO
          </v-btn>
          <v-btn color="green" class="mr-2" @click="setState('ENT')" :loading="actLoading">
            ENTREGADO
          </v-btn>
        </div>

        <div class="text-caption mt-3">
          Estos botones llaman POST <code>/api/local/orders/{folio}/set-state</code> con <code>{ code }</code>.
        </div>
      </v-card-text>
    </v-card>

    <!-- Agregar evento simple (nota) -->
    <v-card rounded="xl" v-if="data">
      <v-card-text>
        <div class="text-subtitle-1 mb-3">Agregar evento</div>
        <v-textarea v-model="nota" label="Nota (opcional)" rows="3" />
        <v-btn color="primary" class="mt-2" @click="addEvent" :loading="evtLoading">GUARDAR EVENTO</v-btn>
      </v-card-text>
    </v-card>

    <v-alert v-else type="info" variant="tonal">Carga un folio para administrar el tracking.</v-alert>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { get, post } from '../lib/api'

type Step = { codigo: string; nombre: string; paso_publico: number }
type TrackingResp = {
  orden: { id:number; folio:string; total:number; estado_codigo:string; estado_nombre:string; paso_publico:number }
  entrega?: any
  eventos: Array<{ id:number; lat:number|null; lng:number|null; creado_en:string; nota?:string|null }>
  steps: Step[]
}

const folio = ref<string>('')
const data = ref<TrackingResp | null>(null)
const loading = ref(false)
const actLoading = ref(false)
const evtLoading = ref(false)
const nota = ref<string>('')

const auto = ref(false)
let timer: number | null = null

async function loadTracking() {
  if (!folio.value) return
  loading.value = true
  try {
    data.value = await get<TrackingResp>(`/api/local/orders/${folio.value}/tracking`)
  } catch (e) {
    console.error(e)
    data.value = null
    alert('No se pudo cargar el tracking (verifica el folio y el backend).')
  } finally {
    loading.value = false
  }
}

async function setState(code: string) {
  if (!folio.value) return
  actLoading.value = true
  try {
    await post(`/api/local/orders/${folio.value}/set-state`, { code })
    await loadTracking()
    localStorage.setItem('track-bump', JSON.stringify({ folio: folio.value, t: Date.now() }))
  } catch (e) {
    console.error(e)
    alert('No se pudo actualizar el estado.')
  } finally {
    actLoading.value = false
  }
}

async function addEvent() {
  if (!folio.value) return
  evtLoading.value = true
  try {
    await post(`/api/local/orders/${folio.value}/events`, { note: nota.value || null })
    nota.value = ''
    await loadTracking()
  } catch (e) {
    console.error(e)
    alert('No se pudo guardar el evento.')
  } finally {
    evtLoading.value = false
  }
}

function toggleAuto() {
  auto.value = !auto.value
  if (auto.value) {
    timer = window.setInterval(loadTracking, 3000) as unknown as number
  } else if (timer) {
    window.clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  const url = new URL(window.location.href)
  const f = url.searchParams.get('folio')
  if (f) { folio.value = f }
})
onBeforeUnmount(() => { if (timer) window.clearInterval(timer) })
</script>
