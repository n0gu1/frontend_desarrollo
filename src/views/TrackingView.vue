<template>
  <v-container class="py-6">
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <div class="text-overline">Seguimiento de orden</div>
        <div class="text-h6">Folio: <span class="font-mono">{{ folio }}</span></div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" color="primary" @click="refresh" :loading="loading" prepend-icon="mdi-refresh">
          Actualizar
        </v-btn>
        <v-btn v-if="tracking?.orden?.folio" variant="text" color="grey" @click="copiarFolio" prepend-icon="mdi-content-copy">
          Copiar folio
        </v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-skeleton-loader v-if="loading && !tracking" type="article, actions, image" class="mb-6" />

    <template v-else>
      <!-- Tarjeta resumen -->
      <v-card class="mb-6" rounded="xl">
        <v-card-text class="d-flex flex-wrap ga-6">
          <div>
            <div class="text-caption text-grey">Estado</div>
            <v-chip :color="estadoColor" variant="flat">{{ estadoActualTexto }}</v-chip>
          </div>
          <div>
            <div class="text-caption text-grey">Total</div>
            <div class="text-h6">Q {{ toMoney(tracking?.orden?.total) }}</div>
          </div>
          <div>
            <div class="text-caption text-grey">Método de pago</div>
            <div>{{ tracking?.orden?.metodo_pago ?? '—' }}</div>
          </div>
          <div v-if="tracking?.orden?.area">
            <div class="text-caption text-grey">Área</div>
            <div>{{ tracking?.orden?.area?.nombre ?? tracking?.orden?.area }}</div>
          </div>
          <div class="ml-auto d-flex ga-2">
            <!-- Reenviar constancia por email (opcional) -->
            <v-btn
              v-if="puedeReenviar"
              :loading="sending"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-email-fast-outline"
              @click="reenviarEmail"
            >
              Reenviar constancia
            </v-btn>
            <!-- Descargar PDF si backend expone URL directa -->
            <v-btn
              v-if="pdfUrl"
              :href="pdfUrl"
              target="_blank"
              rel="noopener"
              variant="text"
              prepend-icon="mdi-file-pdf-box"
            >
              Descargar PDF
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Línea de tiempo de estados -->
      <v-card class="mb-6" rounded="xl">
        <v-card-title class="text-subtitle-1">Progreso</v-card-title>
        <v-divider />
        <v-card-text>
          <v-timeline density="compact" side="end">
            <v-timeline-item
              v-for="(ev, idx) in eventosOrden"
              :key="idx"
              :dot-color="idx === 0 ? 'primary' : 'grey'"
              :icon="idx === 0 ? 'mdi-check-circle' : 'mdi-circle-small'"
            >
              <div class="font-medium">{{ ev.titulo }}</div>
              <div class="text-caption text-grey">
                {{ formatDateTime(ev.cuando) }} — {{ ev.descripcion }}
              </div>
            </v-timeline-item>

            <v-timeline-item
              v-for="(ev, idx) in eventosEntrega"
              :key="'e-'+idx"
              dot-color="secondary"
              icon="mdi-truck-delivery-outline"
            >
              <div class="font-medium">{{ ev.titulo }}</div>
              <div class="text-caption text-grey">
                {{ formatDateTime(ev.cuando) }}
                <span v-if="ev.pos"> · {{ ev.pos }}</span>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>

      <!-- QR si viene del backend -->
      <v-card v-if="qrSrc" rounded="xl" class="mb-6">
        <v-card-title class="text-subtitle-1">Código QR para entrega</v-card-title>
        <v-divider />
        <v-card-text class="d-flex align-center ga-6">
          <img :src="qrSrc" alt="QR" style="width:140px;height:140px" />
          <div class="text-body-2">
            Muestra este código al repartidor para facilitar la entrega.
          </div>
        </v-card-text>
      </v-card>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { get, post } from '../lib/api'

type TrackingResp = {
  orden?: any
  historial?: Array<any>      // estados de la orden
  entrega?: any               // info de entrega
  eventos?: Array<any>        // eventos de entrega
  qr?: { dataUrl?: string }   // QR como dataurl (opcional)
  pdfUrl?: string             // url directa al pdf (opcional)
}

const route = useRoute()
const router = useRouter()
const folio = String(route.params.folio || '')
const loading = ref(false)
const error = ref<string | null>(null)
const tracking = ref<TrackingResp | null>(null)

const polling = ref<number | null>(null)
const sending = ref(false)

const estadoActualTexto = computed(() => {
  const o = tracking.value?.orden
  return o?.estado_nombre || o?.estado || o?.estado_actual || '—'
})
const estadoColor = computed(() => {
  const t = (estadoActualTexto.value || '').toString().toLowerCase()
  if (t.includes('listo') || t.includes('entregado') || t.includes('final')) return 'success'
  if (t.includes('pend') || t.includes('en ruta') || t.includes('proceso')) return 'warning'
  return 'grey'
})

const pdfUrl = computed(() => tracking.value?.pdfUrl || tracking.value?.orden?.pdf_url || null)
const qrSrc  = computed(() => tracking.value?.qr?.dataUrl || tracking.value?.orden?.qr_dataurl || null)

// Normaliza historial de la orden a items de timeline
const eventosOrden = computed(() => {
  const hist = tracking.value?.historial || tracking.value?.orden?.historial || []
  return (hist || []).map((h: any) => ({
    titulo: h.estado_nombre || h.estado || h.transicion || 'Cambio de estado',
    cuando: h.creado_en || h.fecha || h.timestamp || h.cuando,
    descripcion: h.notas || ''
  })).sort((a:any,b:any) => new Date(b.cuando).getTime() - new Date(a.cuando).getTime())
})

// Normaliza eventos/estados de entrega
const eventosEntrega = computed(() => {
  const evs = tracking.value?.eventos || tracking.value?.entrega?.eventos || []
  return (evs || []).map((e: any) => ({
    titulo: e.estado || e.estado_nombre || 'Entrega',
    cuando: e.creado_en || e.fecha || e.timestamp || e.cuando,
    pos: (e.lat && e.lng) ? `${Number(e.lat).toFixed(5)}, ${Number(e.lng).toFixed(5)}` : null
  })).sort((a:any,b:any) => new Date(b.cuando).getTime() - new Date(a.cuando).getTime())
})

onMounted(async () => {
  if (!folio) { router.push('/shop'); return }
  await refresh()
  // polling suave cada 20 s
  polling.value = window.setInterval(refresh, 20000)
})
onBeforeUnmount(() => {
  if (polling.value) window.clearInterval(polling.value)
})

async function refresh() {
  loading.value = true; error.value = null
  try {
    // Endpoint principal (ajusta si tu backend usa otro):
    // Devuelve TrackingResp (orden, historial, entrega, etc).
    const url = `/api/orders/tracking?folio=${encodeURIComponent(folio)}`
    const r = await get<TrackingResp>(url)
    tracking.value = r || {}
  } catch (e:any) {
    error.value = e?.message || 'No se pudo cargar el tracking.'
  } finally {
    loading.value = false
  }
}

function toMoney(n:any) {
  const v = Number(n ?? 0)
  return v.toFixed(2)
}
function formatDateTime(s:any) {
  if (!s) return '—'
  const d = new Date(s)
  return isNaN(d.getTime()) ? String(s) : d.toLocaleString()
}

const puedeReenviar = computed(() => {
  // Puedes controlar con más lógica (estado pagado, etc.)
  return !!tracking.value?.orden?.folio
})

async function reenviarEmail() {
  try {
    sending.value = true
    const email = localStorage.getItem('email') || localStorage.getItem('userEmail') || ''
    const nickname = localStorage.getItem('nickname') || ''
    // Si no hay email guardado, intenta pedirlo rápido:
    let correo = email
    if (!correo) {
      correo = prompt('Ingresa tu correo para reenviar la constancia:') || ''
      if (correo) localStorage.setItem('email', correo)
    }
    if (!correo) return

    await post('/api/orders/receipt-email', {
      email: correo,
      nickname: nickname || 'cliente',
      folio,
      total: tracking.value?.orden?.total ?? 0,
      items: (tracking.value?.orden?.items || []).map((it:any) => ({
        nombre: it.nombre || `#${it.producto_id}`,
        cantidad: it.cantidad,
        precioUnitario: it.precio_unitario
      }))
    })
    alert('Enviamos la constancia a tu correo.')
  } catch (e:any) {
    alert(e?.message || 'No se pudo reenviar el correo.')
  } finally {
    sending.value = false
  }
}

function copiarFolio() {
  navigator.clipboard?.writeText(folio)
}
</script>
